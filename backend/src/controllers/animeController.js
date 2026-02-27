const Anime = require("../models/Anime");
const Watchlist = require("../models/Watchlist");

// Browse catalog payload.
async function listAnime(req, res) {
  const animes = await Anime.find().sort({ releaseYear: -1, title: 1 });
  res.json(animes);
}

// Single anime lookup by Mongo id.
async function getAnimeById(req, res) {
  const anime = await Anime.findById(req.params.id);
  if (!anime) return res.status(404).json({ message: "Anime not found" });
  res.json(anime);
}

// Single anime lookup by slug.
async function getAnimeBySlug(req, res) {
  const anime = await Anime.findOne({ slug: req.params.slug });
  if (!anime) return res.status(404).json({ message: "Anime not found" });
  res.json(anime);
}

// Curated homepage collections.
async function getAnimeHighlights(req, res) {
  try {
    const [topRated, recent2025, comingSoon, trending] = await Promise.all([
      Anime.find().sort({ avgRating: -1, title: 1 }).limit(6),
      Anime.find({ releaseYear: 2025 }).sort({ avgRating: -1, title: 1 }).limit(6),
      Anime.find({ status: "coming_soon" }).sort({ releaseYear: 1, title: 1 }).limit(6),
      Watchlist.aggregate([
        { $group: { _id: "$animeId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
        {
          $lookup: {
            from: "animes",
            localField: "_id",
            foreignField: "_id",
            as: "anime",
          },
        },
        { $unwind: "$anime" },
        { $replaceRoot: { newRoot: "$anime" } },
      ]),
    ]);

    res.json({
      topRated,
      recent2025,
      trending,
      comingSoon,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load highlights" });
  }
}

module.exports = { listAnime, getAnimeById, getAnimeBySlug, getAnimeHighlights };
