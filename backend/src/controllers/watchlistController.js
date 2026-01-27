const Watchlist = require("../models/Watchlist");
const Anime = require("../models/Anime");

const VALID_STATUSES = ["planned", "watching", "completed", "dropped"];

function validateStatus(status) {
  return VALID_STATUSES.includes(status);
}

function validateFavorite(value) {
  return typeof value === "boolean";
}

function toPayload(doc) {
  return {
    _id: doc._id,
    status: doc.status,
    favorite: Boolean(doc.favorite),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    anime: {
      _id: doc.animeId?._id,
      title: doc.animeId?.title,
      slug: doc.animeId?.slug,
      synopsis: doc.animeId?.synopsis,
      releaseYear: doc.animeId?.releaseYear,
      avgRating: doc.animeId?.avgRating,
      status: doc.animeId?.status,
      posterUrl: doc.animeId?.posterUrl,
      localPoster: doc.animeId?.localPoster,
    },
  };
}

// GET /api/watchlist
async function getWatchlist(req, res) {
  try {
    const items = await Watchlist.find({ userId: req.user.id }).populate(
      "animeId",
      "title slug synopsis releaseYear avgRating status posterUrl localPoster"
    );
    res.json(items.map(toPayload));
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch watchlist" });
  }
}

// POST /api/watchlist
async function addWatchlistItem(req, res) {
  const { animeId, status = "planned", favorite = false } = req.body || {};

  if (!animeId) return res.status(400).json({ message: "animeId is required" });
  if (!validateStatus(status)) return res.status(400).json({ message: "Invalid status value" });
  if (!validateFavorite(favorite))
    return res.status(400).json({ message: "favorite must be boolean" });
  try {
    const anime = await Anime.findById(animeId);
    if (!anime) return res.status(404).json({ message: "Anime not found" });

    const existing = await Watchlist.findOne({ userId: req.user.id, animeId });
    if (existing) return res.status(409).json({ message: "Anime already in watchlist" });

    const item = await Watchlist.create({ userId: req.user.id, animeId, status, favorite });
    await item.populate(
      "animeId",
      "title slug synopsis releaseYear avgRating status posterUrl localPoster"
    );

    return res.status(201).json(toPayload(item));
  } catch (err) {
    return res.status(500).json({ message: "Failed to add to watchlist" });
  }
}

// PATCH /api/watchlist/:animeId
async function updateWatchlistItem(req, res) {
  const { status, favorite } = req.body || {};
  if (status !== undefined && !validateStatus(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }
  if (favorite !== undefined && !validateFavorite(favorite)) {
    return res.status(400).json({ message: "favorite must be boolean" });
  }
  if (status === undefined && favorite === undefined) {
    return res.status(400).json({ message: "Provide status or favorite to update" });
  }

  try {
    const item = await Watchlist.findOne({ userId: req.user.id, animeId: req.params.animeId });
    if (!item) return res.status(404).json({ message: "Watchlist item not found" });

    if (status !== undefined) {
      item.status = status;
    }
    if (favorite !== undefined) {
      item.favorite = favorite;
    }

    await item.save();
    await item.populate(
      "animeId",
      "title slug synopsis releaseYear avgRating status posterUrl localPoster"
    );
    return res.json(toPayload(item));
  } catch (err) {
    return res.status(500).json({ message: "Failed to update watchlist" });
  }
}

// PATCH /api/watchlist/:animeId/favorite
async function updateWatchlistFavorite(req, res) {
  const { favorite } = req.body || {};
  if (!validateFavorite(favorite)) {
    return res.status(400).json({ message: "favorite must be boolean" });
  }

  try {
    const item = await Watchlist.findOne({ userId: req.user.id, animeId: req.params.animeId });

    if (!item) return res.status(404).json({ message: "Watchlist item not found" });

    item.favorite = favorite;
    await item.save();
    await item.populate(
      "animeId",
      "title slug synopsis releaseYear avgRating status posterUrl localPoster"
    );

    return res.json(toPayload(item));
  } catch (err) {
    return res.status(500).json({ message: "Failed to update favorite" });
  }
}

// DELETE /api/watchlist/:animeId
async function deleteWatchlistItem(req, res) {
  try {
    const deleted = await Watchlist.findOneAndDelete({
      userId: req.user.id,
      animeId: req.params.animeId,
    });

    if (!deleted) return res.status(404).json({ message: "Watchlist item not found" });

    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ message: "Failed to remove watchlist item" });
  }
}

module.exports = {
  getWatchlist,
  addWatchlistItem,
  updateWatchlistItem,
  updateWatchlistFavorite,
  deleteWatchlistItem,
};
