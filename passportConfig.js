const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const { User } = require("./models");
passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email: email });
        if (!user) return done(null, false, { message: "invalid email" });
        if (!bcrypt.compareSync(password, user.password))
          return done(null, false, { message: "invalid password" });
        return done(null, user);
      } catch (err) {
        done(err);
      }
    }
  )
);
passport.serializeUser((user, done) => {
  done(null, user._id);
});
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});
module.exports = passport;
