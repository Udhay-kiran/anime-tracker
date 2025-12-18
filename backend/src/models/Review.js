const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    animeId: { type: mongoose.Schema.Types.ObjectId, ref: "Anime", required: true },
    rating: {
      type: Number,
      min: 1,
      max: 10,
      validate: {
        validator: function (v) {
          return v === undefined || v === null || (v >= 1 && v <= 10);
        },
        message: "Rating must be between 1 and 10",
      },
    },
    text: { type: String, required: true, minlength: 5, maxlength: 2000 },
  },
  { timestamps: true }
);

reviewSchema.index({ userId: 1, animeId: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
