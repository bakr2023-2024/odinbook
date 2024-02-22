require("dotenv").config();
var express = require("express");
var app = express();
var path = require("path");
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI);
const { isAuthenticated } = require("./authMiddleware");
const cookieParser = require("cookie-parser");
const passport = require("./passportConfig");
const session = require("express-session");
const passportSocketIo = require("passport.socketio");
const { onAuthorizeFail, onAuthorizeSuccess } = require("./authMiddleware");
const MongoStore = require("connect-mongo")(session);
const store = new MongoStore({ mongooseConnection: mongoose.connection });
const port = process.env.PORT || 3000;
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const logger = require("morgan");
const flash = require("express-flash");
var authRouter = require("./routes/auth");
var userRouter = require("./routes/user");
var postRouter = require("./routes/post");
var commentRouter = require("./routes/comment");
const chatRouter = require("./routes/chat");
const cors = require("cors");
const { Chat } = require("./models");
app.use(cors());
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(
  session({
    secret: process.env.SECRET,
    saveUninitialized: true,
    resave: false,
    key: "express.sid",
    store: store,
  })
);

//app.use(logger("dev"));
app.use(flash());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(passport.initialize());
app.use(passport.session());
app.use("/", authRouter);
app.use(isAuthenticated);
app.use("/user", userRouter);
app.use("/post", postRouter);
app.use("/comment", commentRouter);
app.use("/chat", chatRouter);
io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: "express.sid",
    secret: process.env.SECRET,
    store: store,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail,
  })
);
let onlineUsers = 0;
let chatBuffer = [];
const getDate = () => {
  const date = new Date();
  return `${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`;
};
io.on("connection", async (socket) => {
  const chatType = socket.handshake.query.type || "global";
  const roomKey = socket.handshake.query.roomKey || null;
  if (chatType === "private") {
    const chat = new Chat({
      chatId: roomKey,
    });
    await chat.save();
    socket.join(roomKey);
    io.to(roomKey).emit("user", {
      id: socket.request.user._id,
      name: socket.request.user.fullName,
      date: getDate(),
      onlineUsers: ++onlineUsers,
      connected: true,
    });
  } else {
    io.emit("user", {
      id: socket.request.user._id,
      name: socket.request.user.fullName,
      date: getDate(),
      onlineUsers: ++onlineUsers,
      connected: true,
    });
  }

  socket.on("message", async (data) => {
    if (chatType === "global") {
      io.emit("new message", {
        id: socket.request.user._id,
        date: getDate(),
        name: socket.request.user.fullName,
        message: data.message,
      });
    } else if (chatType === "private") {
      if (chatBuffer.length === 10) {
        await Chat.findOneAndUpdate(
          { chatId: roomKey },
          { $push: { chatMessages: { $each: chatBuffer } } }
        );
        chatBuffer = [];
      }
      const messageObj = {
        name: socket.request.user.fullName,
        date: getDate(),
        message: data.message,
      };
      chatBuffer.push(messageObj);
      io.to(roomKey).emit("new message", messageObj);
    }
  });
  socket.on("disconnect", async () => {
    if (chatType === "private") {
      await Chat.findOneAndUpdate(
        { chatId: roomKey },
        { $push: { chatMessages: { $each: chatBuffer } } }
      );
      chatBuffer = [];
      socket.leave(roomKey);
      io.to(roomKey).emit("user", {
        id: socket.request.user._id,
        date: getDate(),
        name: socket.request.user.fullName,
        onlineUsers: --onlineUsers,
        connected: false,
      });
    } else {
      io.emit("user", {
        id: socket.request.user._id,
        date: getDate(),
        name: socket.request.user.fullName,
        onlineUsers: --onlineUsers,
        connected: false,
      });
    }
  });
});
http.listen(port, () => {
  console.log("listening at http://localhost:" + port);
});
