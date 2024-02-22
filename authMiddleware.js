const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) next();
  else {
    req.flash("error", "please login before accessing this page");
    res.redirect("/login");
  }
};
const isNotAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated()) next();
  else {
    res.redirect("/");
  }
};
function onAuthorizeSuccess(data, accept) {
  console.log("successful connection to socket.io");

  accept(null, true);
}
function onAuthorizeFail(data, message, error, accept) {
  if (error) throw new Error(message);
  console.log("failed connection to socket.io:", message);
  accept(null, false);
}
module.exports = {
  isAuthenticated,
  isNotAuthenticated,
  onAuthorizeFail,
  onAuthorizeSuccess,
};
