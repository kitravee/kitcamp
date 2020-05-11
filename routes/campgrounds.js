const express = require("express");
const router = express.Router();
const Campground = require("../models/campground");
const middleware = require("../middleware");

//INDEX - show all campgrounds
router.get("/", (req, res) => {
  // Get all campgrounds from DB
  Campground.find({}, (err, allCampgrounds) => {
    if (err) {
      console.log(err);
    } else {
      res.render("campgrounds/index", { campgrounds: allCampgrounds, page: 'campgrounds' });
    }
  });
});

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, (req, res) => {
  const newCamp = req.body.campground;
  newCamp.author = {
    id: req.user._id,
    username: req.user.username,
  };
  Campground.create(newCamp, (err, campground) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/campgrounds");
    }
  });
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
