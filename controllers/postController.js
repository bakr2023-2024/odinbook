const { User, Post, Comment } = require("../models");
const getAllPosts = async () => {
  const posts = await Post.find()
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
  return posts;
};
const getAllUserPosts = async (userId) => {
  const posts = await Post.find({ author: userId }).populate([
    {
      path: "author",
      model: User,
    },
    {
      path: "comments",
      model: Comment,
      populate: {
        path: "author",
        model: User,
      },
    },
  ]);
  return posts;
};
const getAllFollowsPosts = async (userId) => {
  const user = await User.findById(userId).populate({
    path: "follows",
    model: User,
  });
  const follows = user.follows;

  const followsPosts = [];
  for (const followedUser of follows) {
    const posts = await Post.find({ author: followedUser._id }).populate([
      {
        path: "author",
        model: User,
      },
      {
        path: "comments",
        model: Comment,
        populate: {
          path: "author",
          model: User,
        },
      },
    ]);
    followsPosts.push(...posts);
  }

  return followsPosts;
};

const getAllFriendsPosts = async (userId) => {
  const user = await User.findById(userId).populate({
    path: "friends",
    model: User,
  });
  const friends = user.friends;

  const friendsPosts = [];
  for (const friend of friends) {
    const posts = await Post.find({ author: friend._id }).populate([
      {
        path: "author",
        model: User,
      },
      {
        path: "comments",
        model: Comment,
        populate: {
          path: "author",
          model: User,
        },
      },
    ]);
    friendsPosts.push(...posts);
  }

  return friendsPosts;
};

module.exports = {
  getAllPosts,
  getAllUserPosts,
  getAllFollowsPosts,
  getAllFriendsPosts,
};
