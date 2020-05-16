//MIDDLEWARE
const Campground = require("../models/campground");
const Comment = require("../models/comment");
const middlewareObj = {};

middlewareObj.checkCampgroundOwnership = function (req, res, next) {
  if (req.isAuthenticated()) {
    Campground.findById(req.params.id, (err, campground) => {
      if (err || !campground) {
        req.flash("error", "Campground not found");
        res.redirect("back");
      } else {
        // does user own the campground?
        if (req.user._id.equals(campground.author.id) || req.user.isAdmin) {
          next();
        } else {
          req.flash("error", "You don't have permission to do that");
          res.redirect("back");
        }
      }
    });
  } else {
    req.flash("error", "You need to be logged in to do that");
    res.redirect("back");
  }
};

middlewareObj.checkCommentOwnership = function (req, res, next) {
  if (req.isAuthenticated()) {
    Comment.findById(req.params.comment_id, (err, comment) => {
      if (err || !comment) {
        req.flash("error", "Comment not found");
        res.redirect("back");
      } else {
        // does user own the campground?
        if (req.user._id.equals(comment.author.id) || req.user.isAdmin) {
          next();
        } else {
          req.flash("error", "You don't have permission to do that");
          res.redirect("back");
        }
      }
    });
  } else {
    // req.flash("error", "You need to be logged in to do that");
    res.redirect("back");
  }
};

// middlewareObj.isLoggedIn = function (req, res, next) {
//   if (req.isAuthenticated()) {
//     return next();
//   }
//   req.flash("error", "You need to be logged in to do that");
//   res.redirect("/login");
// };

middlewareObj.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.session.redirectTo = req.originalUrl;
  req.flash("error", "You need to be logged in to do that");
  res.redirect("/login");
};

module.exports = middlewareObj;
