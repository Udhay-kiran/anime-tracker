const mongoose = require("mongoose");

const AnimeSchema = new mongoose.Schema(
  {
    // Core identity
    title: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },

    // Display info
    synopsis: { type: String, default: "" },
    posterUrl: { type: String, default: "" },
    bannerUrl: { type: String, default: "" },

    // Meta
    releaseYear: { type: Number, min: 1900, max: 3000 },
    status: {
      type: String,
      enum: ["coming_soon", "airing", "finished", "hiatus"],
      default: "finished",
      index: true,
    },

    // Tags / filters
    genres: { type: [String], default: [], index: true }, // e.g. ["Action", "Shounen"]
    studio: { type: String, default: "" },

    // Stats (can grow later)
    avgRating: { type: Number, default: 0, min: 0, max: 10 },
    ratingsCount: { type: Number, default: 0, min: 0 },

    // Optional structure for your detail page
    seasonsCount: { type: Number, default: 1, min: 1 },
    episodesCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);
AnimeSchema.pre("validate", function () {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title);
  }
});
module.exports = mongoose.model("Anime", AnimeSchema);
