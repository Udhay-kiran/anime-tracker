const mongoose = require("mongoose");

const AnimeSchema = new mongoose.Schema(
  {
    // Identity fields used for lookups and routing.
    title: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },

    // Content shown in cards and detail pages.
    synopsis: { type: String, default: "" },
    description: { type: String, default: "" },
    posterUrl: { type: String, required: true, default: "" },
    bannerUrl: { type: String, default: "" },

    // Release metadata used for filtering.
    releaseYear: { type: Number, min: 1900, max: 3000 },
    status: {
      type: String,
      enum: ["coming_soon", "airing", "finished", "hiatus"],
      default: "finished",
      index: true,
    },

    // Tag-like fields used in browse filters.
    genres: { type: [String], default: [], index: true },
    studio: { type: String, default: "" },

    // Aggregated stats.
    avgRating: { type: Number, default: 0, min: 0, max: 10 },
    ratingsCount: { type: Number, default: 0, min: 0 },

    // Optional detail metadata.
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
