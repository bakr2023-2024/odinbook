var express = require("express");
const { User } = require("../models");
var router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const bcrypt = require("bcryptjs");
const passport = require("passport");
const { body, validationResult } = require("express-validator");
const { isAuthenticated, isNotAuthenticated } = require("../authMiddleware");
const {
  getAllUserPosts,
  getAllFollowsPosts,
  getAllFriendsPosts,
} = require("../controllers/postController");
const {
  getRandomUsers,
  getAllOnlineFriends,
} = require("../controllers/userController");
router.get("/", isAuthenticated, async (req, res) => {
  const followsPosts = await getAllFollowsPosts(req.user._id);
  const userPosts = await getAllUserPosts(req.user._id);
  const friendsPosts = await getAllFriendsPosts(req.user._id);
  const allPosts = [...followsPosts, ...friendsPosts, ...userPosts].sort(
    (a, b) => b.likes - a.likes
  );
  const people = await getRandomUsers(req.user._id);
  const onlineFriends = await getAllOnlineFriends(req.user._id);
  res.render("index", {
    user: req.user,
    allPosts,
    people,
    friends: onlineFriends,
  });
});
router.get("/login", isNotAuthenticated, (req, res) => {
  res.render("login");
});
router.get("/register", isNotAuthenticated, (req, res) => {
  res.render("register");
});
router.post(
  "/login",
  isNotAuthenticated,
  body("email").escape(),
  body("password").escape(),
  passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/login",
  }),
  async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { online: true });
    res.redirect("/");
  }
);
router.post(
  "/register",
  upload.single("profilePic"),
  isNotAuthenticated,
  body("firstName").notEmpty().escape().withMessage("please enter first name"),
  body("lastName").notEmpty().escape().withMessage("please enter last name"),
  body("email").isEmail().escape().withMessage("please enter email"),
  body("password").notEmpty().escape().withMessage("please enter password"),
  body("confPassword")
    .notEmpty()
    .escape()
    .custom((val, { req }) => val === req.body.password)
    .withMessage("passwords don't match"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash(
        "error",
        errors.array().map((err) => err.msg)
      );
      return res.render("register");
    }

    const { firstName, lastName, email, password, profilePicUrl } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      req.flash("error", "user already exists");
      return res.render("register");
    }
    let profilePic;
    if (req.file) {
      profilePic = req.file.filename;
    } else if (profilePicUrl) {
      profilePic = profilePicUrl;
    }

    const user = new User({
      firstName,
      lastName,
      email,
      password: bcrypt.hashSync(password, 10),
      profilePic,
    });
    await user.save();
    req.login(user, async (err) => {
      if (err) {
        req.flash("error", err);
        res.render("register");
      } else {
        await User.findByIdAndUpdate(req.user._id, { online: true });
        res.redirect("/");
      }
    });
  }
);
router.delete("/logout", isAuthenticated, async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { online: false });
  req.logout((err) => {
    if (err) return res.sendStatus(400);
    else {
      res.sendStatus(200);
    }
  });
});
module.exports = router;
