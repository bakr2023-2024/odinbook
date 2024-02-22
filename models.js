const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  bio: {
    type: String,
    default: "Hello World",
  },
  dateCreated: {
    type: String,
    default: new Date().toString(),
  },
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  follows: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
  friendRequestsSent: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  friendRequestsReceived: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  profilePic: String,
  online: { type: Boolean, default: false },
});
userSchema.virtual("fullName").get(function () {
  return this.firstName + " " + this.lastName;
});
const User = mongoose.model("users", userSchema);
const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  content: String,
  dateCreated: {
    type: String,
    default: new Date().toString(),
  },
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
  likes: Number,
});
const Post = mongoose.model("posts", postSchema);
const commentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  content: String,
  dateCreated: {
    type: String,
    default: new Date().toString(),
  },
  likes: Number,
});
const Comment = mongoose.model("comments", commentSchema);
const chatSchema = new mongoose.Schema({
  chatId: String,
  chatMessages: [
    {
      name: String,
      date: String,
      message: String,
    },
  ],
});
const Chat = mongoose.model("chats", chatSchema);
const filterInputs = (obj) => {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key]) newObj[key] = obj[key];
  });
  return newObj;
};
module.exports = { User, Post, Comment, Chat, filterInputs };
