const express = require("express");
const router = express.Router();
const { User, Chat } = require("../models");
router.get("/", (req, res) => {
  res.render("chat", { currentUser: req.user });
});
router.get("/:roomKey", async (req, res) => {
  const ids = req.params.roomKey.split("-");
  const chat = await Chat.findOne({ chatId: req.params.roomKey });
  const chatHistory = chat ? chat.chatMessages : [];
  const targetId = ids[0] === String(req.user._id) ? ids[1] : ids[0];
  const targetUser = await User.findById(targetId);
  res.render("privateChat", {
    currentUser: req.user,
    roomKey: req.params.roomKey,
    targetUser,
    chatHistory,
  });
});
module.exports = router;
