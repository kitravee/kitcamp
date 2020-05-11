const mongoose = require("mongoose");
const Comment = require("./comment");

const campgroundSchema = new mongoose.Schema({
  name: String,
  price: String,
  image: String,
  description: String,
  createAt: { type: Date, default: Date.now },
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    username: String,
  },
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
});

campgroundSchema.pre("remove", async function () {
  await Comment.deleteMany({ _id: { $in: this.comments } }, (err) => {
    if (err) {
      console.log(err);
    }
  });
});

module.exports = mongoose.model("Campground", campgroundSchema);
