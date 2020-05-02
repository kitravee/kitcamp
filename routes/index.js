const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");
//REST
router.get("/", (req, res) => {
  res.render("landing");
});

// ==========
// AUTH ROUTE
// ==========

// show register
router.get("/register", (req, res) => {
  res.render("register");
});

//handle sign up logic
router.post("/register", function (req, res) {
  var newUser = new User({ username: req.body.username });
  User.register(newUser, req.body.password, function (err, user) {
    if (err) {
      req.flash("error", err.message);
      return res.redirect("/register");
    }
    passport.authenticate("local")(req, res, function () {
      req.flash("success", "Welcome to YelpCamp " + user.username);
      res.redirect("/campgrounds");
    });
  });
});

// show login
router.get("/login", (req, res) => {
  res.render("login");
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
router.get("/logout", function (req, res) {
  req.logout();
  req.flash("success", "Logged you out!");
  res.redirect("/campgrounds");
});

module.exports = router;