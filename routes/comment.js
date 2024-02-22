const express = require("express");
const router = express.Router();
const { Comment, Post, User } = require("../models");
const { ObjectId } = require("mongodb");
router.post("/", async (req, res) => {
  try {
    const { content, postId, userId } = req.body;
    const comment = await Comment.create({
      author: new ObjectId(userId),
      content,
      likes: 0,
    });
    const newComment = await Comment.findById(comment._id).populate({
      path: "author",
      model: User,
    });
    console.log("new comment", newComment.author.fullName);
    const post = await Post.findById(postId);
    post.comments.push(newComment._id);
    await post.save();
    res.status(200).json({ comment: newComment, length: post.comments.length });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});
router.put("/:commentId/like", async (req, res) => {
  const incValue = req.body.inc === "true" ? 1 : -1;
  const updatedComment = await Comment.findByIdAndUpdate(
    req.params.commentId,
    {
      $inc: { likes: incValue },
    },
    { new: true }
  );
  return res.status(200).json(updatedComment);
});
router.put("/:commentId", async (req, res) => {
  try {
    const { content } = req.body;
    const updatedComment = await Comment.findByIdAndUpdate(
      req.params.commentId,
      { content },
      { new: true }
    );
    res.status(200).json({ comment: updatedComment, length: null });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:commentId", async (req, res) => {
  try {
    const deletedComment = await Comment.findByIdAndDelete(
      req.params.commentId
    );
    const post = await Post.findOneAndUpdate(
      { comments: req.params.commentId },
      { $pull: { comments: req.params.commentId } },
      { new: true }
    );
    res.status(200).json({ length: post.comments.length });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
