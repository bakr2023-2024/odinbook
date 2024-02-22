const express = require("express");
const router = express.Router();
const { Post, User, Comment } = require("../models");
const { ObjectId } = require("mongodb");

router.post("/", async (req, res) => {
  try {
    const { content } = req.body;
    const post = new Post({
      author: req.user._id,
      content,
      comments: [],
      likes: 0,
    });
    await post.save();
    const newPost = await Post.findById(post._id)
      .populate({
        path: "author",
        model: User,
      })
      .populate({
        path: "comments",
        model: Comment,
        populate: {
          path: "author",
          model: User,
        },
      });
    const user = await User.findById(req.user._id);
    user.posts.push(newPost._id);
    await user.save();
    res.status(200).json(newPost);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
router.put("/:postId/like", async (req, res) => {
  try {
    const incValue = req.body.inc === "true" ? 1 : -1;

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.postId,
      { $inc: { likes: incValue } },
      { new: true }
    );
    console.log("new post likes", updatedPost.likes);
    res.status(200).json(updatedPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
router.put("/:postId", async (req, res) => {
  try {
    const { content } = req.body;
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.postId,
      { content },
      { new: true }
    )
      .populate({
        path: "author",
        model: User,
      })
      .populate({
        path: "comments",
        model: Comment,
        populate: {
          path: "author",
          model: User,
        },
      });
    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});
router.delete("/:postId", async (req, res) => {
  try {
    const deletedPost = await Post.findByIdAndDelete(req.params.postId);
    await Comment.deleteMany({ _id: { $in: deletedPost.comments } });
    const user = await User.findById(req.user._id);
    user.posts = user.posts.filter(
      (postId) => postId.toString() !== req.params.postId
    );
    await user.save();
    res.status(200).end();
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
