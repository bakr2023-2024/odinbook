const { User, Comment, Post } = require("../models");
const getAllUsers = async () => {
  const users = await User.find()
    .populate({
      path: "posts",
      model: Post,
    })
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
  return users;
};
const getAllFriends = async (userId) => {
  const user = await User.findById(userId).populate({
    path: "friends",
    model: User,
  });
  return user.friends;
};
const getAllFollowers = async (userId) => {
  const user = await User.findById(userId).populate({
    path: "followers",
    model: User,
  });
  return user.followers;
};
const getAllFollows = async (userId) => {
  const user = await User.findById(userId).populate({
    path: "follows",
    model: User,
  });
  return user.follows;
};
const getRandomUsers = async (userId) => {
  try {
    const users = await User.aggregate([
      { $match: { _id: { $not: { $eq: userId } } } },
      { $sample: { size: 5 } },
    ]);
    return users;
  } catch (err) {
    return [];
  }
};
const getAllOnlineFriends = async (userId) => {
  const user = await User.findById(userId).populate({
    path: "friends",
    model: User,
  });
  const onlineFriends = user.friends.filter((friend) => friend.online);
  return onlineFriends;
};
module.exports = {
  getAllUsers,
  getAllFriends,
  getAllFollowers,
  getAllFollows,
  getRandomUsers,
  getAllOnlineFriends,
};
