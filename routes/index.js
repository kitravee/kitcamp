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
  const newUser = new User({ username: req.body.username });
  User.register(newUser, req.body.password, (err, user) => {
    if (err) {
      return res.render("register", { error: err.message });
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
// router.post(
//   "/login",
//   passport.authenticate("local", {
//     successRedirect: "/campgrounds",
//     failureRedirect: "/login",
//   }),
//   (req, res) => {
//     return;
//   }
// );

router.post("/login", function (req, res, next) {
  passport.authenticate("local", function (err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect("/login");
    }
    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }
      var redirectTo = req.session.redirectTo
        ? req.session.redirectTo
        : "/campgrounds";
      delete req.session.redirectTo;
      res.redirect(redirectTo);
    });
  })(req, res, next);
});

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

router.get("/follow/:id", middleware.isLoggedIn, async function (req, res) {
  try {
    // follower
    let user = await User.findById(req.params.id);
    user.followers.push(req.user._id);
    user.save();
    //for following
    let currentUser = await User.findById(req.user._id);
    currentUser.following.push(req.params.id);
    currentUser.save();

    req.flash("success", "Successfully followed " + user.username + "!");
    res.redirect("/users/" + req.params.id);
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("back");
  }
});

// unfollow user
router.delete("/unfollow/:id", middleware.isLoggedIn, async function (
  req,
  res
) {
  //follower
  User.findOne({ "_id": req.params.id }, function (err, terget) {
    if (err) {
      req.flash("error", err.message);
      res.redirect("back");
    }
    for (let i = 0; i < terget.followers.length; i++) {
      if (terget.followers[i].equals(req.user._id)) {
        terget.followers.remove(req.user._id);
      }
    }
    terget.save();
  });

  //following
  User.findOne({ "_id": req.user._id }, function (err, terget) {
    if (err) {
      req.flash("error", err.message);
      res.redirect("back");
    }
    for (let i = 0; i < terget.following.length; i++) {
      if (terget.following[i].equals(req.params.id)) {
        terget.following.remove(req.params.id);
      }
    }
    terget.save();
  });
  req.flash("success", "Successfully Unfollowed !");
  res.redirect("/users/" + req.params.id);
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
