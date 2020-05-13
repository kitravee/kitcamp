const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");
const Notification = require("../models/notification");
const middleware = require("../middleware");
//REST
router.get("/", (req, res) => {
  res.render("landing");
});

// ==========
// AUTH ROUTE
// ==========

// show register
router.get("/register", (req, res) => {
  res.render("register", { page: "register" });
});

//handle sign up logic
router.post("/register", (req, res) => {
  var newUser = new User({ username: req.body.username });
  User.register(newUser, req.body.password, (err, user) => {
    if (err) {
      req.flash("error", err.message);
      return res.redirect("/register", { page: "register" });
    }
    passport.authenticate("local")(req, res, () => {
      req.flash("success", "Welcome to YelpCamp " + user.username);
      res.redirect("/campgrounds");
    });
  });
});

// show login
router.get("/login", (req, res) => {
  res.render("login", { page: "login" });
});
// handle login
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/campgrounds",
    failureRedirect: "/login",
  }),
  (req, res) => {
    return;
  }
);

// logic route
router.get("/logout", (req, res) => {
  req.logout();
  req.flash("success", "Logged you out!");
  res.redirect("/campgrounds");
});

// Notification function
// User profile
router.get("/users/:id", async function (req, res) {
  try {
    let user = await User.findById(req.params.id).populate("followers").exec();
    res.render("profile", { user });
  } catch (err) {
    req.flash("error", err.message);
    return res.redirect("back");
  }
});

// follow user
router.get("/follow/:id", middleware.isLoggedIn, async function (req, res) {
  try {
    let user = await User.findById(req.params.id);
    user.followers.push(req.user._id);
    user.save();
    req.flash("success", "Successfully followed " + user.username + "!");
    res.redirect("/users/" + req.params.id);
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("back");
  }
});

// view all notifications
router.get("/notifications", middleware.isLoggedIn, async function (req, res) {
  try {
    let user = await User.findById(req.user._id)
      .populate({
        path: "notifications",
        options: { sort: { "_id": -1 } },
      })
      .exec();
    let allNotifications = user.notifications;
    res.render("notifications/index", { allNotifications });
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("back");
  }
});

// handle notification
router.get("/notifications/:id", middleware.isLoggedIn, async function (
  req,
  res
) {
  try {
    let notification = await Notification.findById(req.params.id);
    notification.isRead = true;
    notification.save();
    res.redirect(`/campgrounds/${notification.campgroundId}`);
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("back");
  }
});

module.exports = router;
