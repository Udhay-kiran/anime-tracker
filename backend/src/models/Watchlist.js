const mongoose = require("mongoose");

const watchlistSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    animeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Anime",
      required: true,
    },
    status: {
      type: String,
      enum: ["planned", "watching", "completed"],
      default: "planned",
      required: true,
    },
  },
  { timestamps: true }
);

watchlistSchema.index({ userId: 1, animeId: 1 }, { unique: true });

module.exports = mongoose.model("Watchlist", watchlistSchema);
