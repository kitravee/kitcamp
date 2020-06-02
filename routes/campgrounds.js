const express = require("express");
const router = express.Router();
const Campground = require("../models/campground");
const middleware = require("../middleware");
const User = require("../models/user");
const Notification = require("../models/notification");
const NodeGeocoder = require("node-geocoder");

const options = {
  provider: "google",
  httpAdapter: "https",
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null,
};

var geocoder = NodeGeocoder(options);
// //INDEX - show all campgrounds
router.get("/", function (req, res) {
  var perPage = 8;
  var pageQuery = parseInt(req.query.page);
  var pageNumber = pageQuery ? pageQuery : 1;
  var noMatch = null;
  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), "gi");
    Campground.find({ name: regex })
      .skip(perPage * pageNumber - perPage)
      .limit(perPage)
      .exec(function (err, allCampgrounds) {
        Campground.countDocuments({ name: regex }).exec(function (err, count) {
          if (err) {
            console.log(err);
            res.redirect("back");
          } else {
            if (allCampgrounds.length < 1) {
              noMatch = "No campgrounds match that query, please try again.";
            }
            res.render("campgrounds/index", {
              campgrounds: allCampgrounds,
              current: pageNumber,
              pages: Math.ceil(count / perPage),
              noMatch: noMatch,
              search: req.query.search,
            });
          }
        });
      });
  } else {
    // get all campgrounds from DB
    Campground.find({})
      .skip(perPage * pageNumber - perPage)
      .limit(perPage)
      .exec(function (err, allCampgrounds) {
        Campground.countDocuments().exec(function (err, count) {
          if (err) {
            console.log(err);
          } else {
            res.render("campgrounds/index", {
              campgrounds: allCampgrounds,
              current: pageNumber,
              pages: Math.ceil(count / perPage),
              noMatch: noMatch,
              search: false,
            });
          }
        });
      });
  }
});

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, async (req, res) => {
  let newCampground = req.body.campground;
  let author = {
    id: req.user._id,
    username: req.user.username,
  };
  geocoder.geocode(newCampground.location, async (err, data) => {
    if (err || !data.length) {
      req.flash("error", "Invalid address");
      return res.redirect("back");
    }
    newCampground = {
      ...newCampground,
      lat: data[0].latitude,
      lng: data[0].longitude,
      location: data[0].formattedAddress,
      author: author,
    };
    try {
      let campground = await Campground.create(newCampground);
      let user = await User.findById(req.user._id).populate("followers").exec();
      let newNotification = {
        username: req.user.username,
        campgroundId: campground.id,
      };
      for (const follower of user.followers) {
        //push to notification table
        let notification = await Notification.create(newNotification);

        //push notification to each user user.followers
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
  let newCampground = req.body.campground;
  geocoder.geocode(newCampground.location, async (err, data) => {
    if (err || !data.length) {
      req.flash("error", "Invalid address");
      return res.redirect("back");
    }
    newCampground = {
      ...newCampground,
      lat: data[0].latitude,
      lng: data[0].longitude,
      location: data[0].formattedAddress,
    };

    Campground.findByIdAndUpdate(
      req.params.id,
      newCampground,
      (err, updatedCampground) => {
        err
          ? res.redirect("/campgrounds")
          : res.redirect(`/campgrounds/${req.params.id}`);
      }
    );
  });
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

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = router;
