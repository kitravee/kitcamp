const express = require("express");
const router = express.Router();
const Campground = require("../models/campground");
const middleware = require("../middleware");
const User = require("../models/user");
const Notification = require("../models/notification");

//INDEX - show all campgrounds
router.get("/", (req, res) => {
  // Get all campgrounds from DB
  Campground.find({}, (err, allCampgrounds) => {
    if (err) {
      console.log(err);
    } else {
      res.render("campgrounds/index", {
        campgrounds: allCampgrounds,
        page: "campgrounds",
      });
    }
  });
});

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, async (req, res) => {
  const newCampground = req.body.campground;
  newCampground.author = {
    id: req.user._id,
    username: req.user.username,
  };
  try {
    let campground = await Campground.create(newCampground);
    let user = await User.findById(req.user._id).populate("followers").exec();
    let newNotification = {
      username: req.user.username,
      campgroundId: campground.id,
    };
    for (const follower of user.followers) {
      let notification = await Notification.create(newNotification);
      follower.notifications.push(notification);
      follower.save();
    }

    //redirect back to campgrounds page
    res.redirect(`/campgrounds/${campground.id}`);
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("back");
  }
});

//NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, (req, res) => {
  res.render("campgrounds/new");
});

// SHOW - shows more info about one campground
router.get("/:id", (req, res) => {
  //find the campground with provided ID
  Campground.findById(req.params.id)
    .populate("comments")
    .exec((err, campground) => {
      if (err || !campground) {
        req.flash("error", "Campground not found");
        res.redirect("back");
      } else {
        //render show template with that campground
        res.render("campgrounds/show", { campground: campground });
      }
    });
});

//EDIT CAMPGROUND ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, (req, res) => {
  Campground.findById(req.params.id, (err, campground) => {
    res.render("campgrounds/edit", { campground: campground });
  });
});

router.put("/:id", middleware.checkCampgroundOwnership, (req, res) => {
  Campground.findByIdAndUpdate(
    req.params.id,
    req.body.campground,
    (err, updatedCampground) => {
      err
        ? res.redirect("/campgrounds")
        : res.redirect(`/campgrounds/${req.params.id}`);
    }
  );
});

//DESTROY CAMPGROUND ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, (req, res) => {
  Campground.findById(req.params.id, (err, campground) => {
    if (err) return next(err);
    campground.remove();
    // req.flash();
    res.redirect("/campgrounds");
  });
});

module.exports = router;
