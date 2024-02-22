const express = require("express");
const router = express.Router();
const { User, Post, Comment, filterInputs } = require("../models");
const { getAllUserPosts } = require("../controllers/postController");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const {
  getAllFriends,
  getAllFollowers,
  getAllFollows,
} = require("../controllers/userController");
const createPrivateRoomKey = (user1Id, user2Id) => {
  const sortedUserIds = [user1Id, user2Id].sort();
  const roomKey = `${sortedUserIds[0]}-${sortedUserIds[1]}`;
  return roomKey;
};
router.get("/find", async (req, res) => {
  const name = req.body.name;
  const regex = new RegExp(name, "i");
  const results = await User.find({ firstName: { $regex: regex } });
  if (results.length > 0) res.json(results);
  else res.sendStatus(400);
});
router.get("/:userId", async (req, res) => {
  const user = await User.findById(req.params.userId);
  const userPosts = await getAllUserPosts(user._id);
  const friendsList = await getAllFriends(user._id);
  const followsList = await getAllFollows(user._id);
  const followersList = await getAllFollowers(user._id);
  const isYou = String(user._id) === String(req.user._id);
  const isFollowsYou = await User.findOne({
    _id: req.user._id,
    followers: user._id,
  });
  const youFollowsThem = await User.findOne({
    _id: req.user._id,
    follows: user._id,
  });
  const isFriends = await User.findOne({
    _id: req.user._id,
    friends: user._id,
  });
  const checkUserSentYou = await User.findOne({
    _id: req.user._id,
    friendRequestsReceived: user._id,
  });
  const checkYouSentUser = await User.findOne({
    _id: req.user._id,
    friendRequestsSent: user._id,
  });
  const event = isFriends
    ? "yes"
    : checkUserSentYou
    ? "waiting you"
    : checkYouSentUser
    ? "waiting them"
    : "no";
  const friendRequests = await User.findById(req.user._id).populate({
    path: "friendRequestsReceived",
    model: User,
  });
  res.render("profile", {
    currentUser: req.user,
    user,
    userPosts,
    friendsList: friendsList,
    followsList: followsList,
    followersList: followersList,
    isFriends: event,
    isYou: isYou ? true : false,
    isFollowsYou: isFollowsYou ? true : false,
    youFollowsThem: youFollowsThem ? true : false,
    requests: friendRequests.friendRequestsReceived,
    createPrivateRoomKey: createPrivateRoomKey,
  });
});
router.put("/follow/:followsId", async (req, res) => {
  const user = await User.findOne({
    _id: req.user._id,
    follows: req.params.followsId,
  });
  if (user) {
    await User.findOneAndUpdate(
      { _id: req.user._id },
      { $pull: { follows: new ObjectId(req.params.followsId) } }
    );
    await User.findOneAndUpdate(
      { _id: req.params.followsId },
      { $pull: { followers: req.user._id } }
    );
    return res.send("unfollowed");
  } else {
    await User.findOneAndUpdate(
      { _id: req.user._id },
      { $push: { follows: new ObjectId(req.params.followsId) } }
    );
    await User.findOneAndUpdate(
      { _id: req.params.followsId },
      { $push: { followers: req.user._id } }
    );
    return res.send("followed");
  }
});
router.put("/friend/:friendId", async (req, res) => {
  const event = req.body.event;
  const friendId = new ObjectId(req.params.friendId);
  console.log("self", req.user._id);
  console.log("friend", friendId);
  if (event === "accept") {
    await User.findOneAndUpdate(
      { _id: req.user._id },
      {
        $push: { friends: friendId },
        $pull: { friendRequestsReceived: friendId },
      }
    );
    await User.findOneAndUpdate(
      { _id: friendId },
      {
        $push: { friends: req.user._id },
        $pull: { friendRequestsSent: req.user._id },
      }
    );
  } else if (event === "reject") {
    await User.findOneAndUpdate(
      { _id: req.user._id },
      { $pull: { friendRequestsReceived: friendId } }
    );
    await User.findOneAndUpdate(
      { _id: friendId },
      { $pull: { friendRequestsSent: req.user._id } }
    );
  } else if (event === "send") {
    await User.findOneAndUpdate(
      { _id: req.user._id },
      { $push: { friendRequestsSent: friendId } }
    );
    await User.findOneAndUpdate(
      { _id: friendId },
      { $push: { friendRequestsReceived: req.user._id } }
    );
  } else if (event === "unfriend") {
    await User.findOneAndUpdate(
      { _id: req.user._id },
      { $pull: { friends: friendId } }
    );
    await User.findOneAndUpdate(
      { _id: friendId },
      { $pull: { friends: req.user._id } }
    );
  } else if (event === "cancel") {
    await User.findOneAndUpdate(
      { _id: friendId },
      { $pull: { friendRequestsReceived: req.user._id } }
    );
    await User.findOneAndUpdate(
      { _id: req.user._id },
      { $pull: { friendRequestsSent: friendId } }
    );
  }
  return res.sendStatus(200);
});
router.delete("/", async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.user._id);

    await Post.deleteMany({ author: deletedUser._id });
    await Comment.deleteMany({ author: deletedUser._id });

    req.logout((err) => {
      if (err) res.sendStatus(404);
      else res.redirect("/login");
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});
router.put("/", upload.single("profilePic"), async (req, res) => {
  try {
    const obj = filterInputs(req.body);
    if (obj.password) {
      obj.password = bcrypt.hashSync(obj.password, 10);
    }
    if (req.file) {
      obj.profilePic = req.file.filename;
    } else if (obj.profilePicUrl) {
      obj.profilePic = obj.profilePicUrl;
    }
    const user = await User.findByIdAndUpdate(req.user._id, obj, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});
module.exports = router;
