//IMPORT LIBRARY
const express = require("express");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const flash = require("connect-flash");
require("dotenv").config();

//APP
const app = express();

//FROM MODELS
// const Campground = require("./models/campground");
// const Comment = require("./models/comment");
const User = require("./models/user");
// const SeedDB = require("./seed");

//AUTHENTICATION
const passport = require("passport");
const LocalStrategy = require("passport-local");

//requring routes
const commentRoutes = require("./routes/comments"),
  campgroundRoutes = require("./routes/campgrounds"),
  indexRoutes = require("./routes/index");

//Add moment to view files via the variable named
app.locals.moment = require("moment");

//H10 error heroku is about process.env.PORT we should add because it not run on port 3000
const url = process.env.DATABASEURL || "mongodb://localhost:27017/yelp_camp";
mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("connect to db");
  })
  .catch((err) => {
    console.log("ERROR:", err.message);
  });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(`${__dirname}/public`));
app.use(methodOverride("_method"));
//flash before passport
app.use(flash());
app.set("view engine", "ejs");
// SeedDB();

//PASSPORT COMFIG
app.use(
  require("express-session")({
    secret: process.env.PASSPORTSECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(async function (req, res, next) {
  res.locals.currentUser = req.user;

  if (req.user) {
    try {
      let user = await User.findById(req.user._id)
        .populate("notifications", null, { isRead: false })
        .exec();
      res.locals.notifications = user.notifications.reverse();
      res.locals.follower = user.follower;
    } catch (err) {
      console.log(err.message);
    }
  }
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use("/", indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`app is running`);
});
