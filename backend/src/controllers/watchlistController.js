const Watchlist = require("../models/Watchlist");
const Anime = require("../models/Anime");

const VALID_STATUSES = ["planned", "watching", "completed", "dropped"];

function validateStatus(status) {
  return VALID_STATUSES.includes(status);
}

function validateStatusNullable(status) {
  return status === undefined || validateStatus(status);
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

// Returns the signed-in user's watchlist with embedded anime summary data.
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

// Adds an anime to watchlist (or favorite-only entry) for the signed-in user.
async function addWatchlistItem(req, res) {
  const { animeId, status, favorite = false } = req.body || {};

  if (!animeId) return res.status(400).json({ message: "animeId is required" });
  if (!validateStatusNullable(status))
    return res.status(400).json({ message: "Invalid status value" });
  if (!validateFavorite(favorite))
    return res.status(400).json({ message: "favorite must be boolean" });
  try {
    const anime = await Anime.findById(animeId);
    if (!anime) return res.status(404).json({ message: "Anime not found" });

    const existing = await Watchlist.findOne({ userId: req.user.id, animeId });
    if (existing) return res.status(409).json({ message: "Anime already in watchlist" });

    const effectiveStatus = status !== undefined ? status : favorite ? undefined : "planned";
    const item = await Watchlist.create({
      userId: req.user.id,
      animeId,
      status: effectiveStatus,
      favorite,
    });
    await item.populate(
      "animeId",
      "title slug synopsis releaseYear avgRating status posterUrl localPoster"
    );

    return res.status(201).json(toPayload(item));
  } catch (err) {
    return res.status(500).json({ message: "Failed to add to watchlist" });
  }
}

// Updates watch status for an existing watchlist row.
async function updateWatchlistStatus(req, res) {
  const { status } = req.body || {};
  if (!validateStatus(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  try {
    const item = await Watchlist.findOne({ userId: req.user.id, animeId: req.params.animeId });
    if (!item) return res.status(404).json({ message: "Watchlist item not found" });

    item.status = status;

    await item.save();
    await item.populate(
      "animeId",
      "title slug synopsis releaseYear avgRating status posterUrl localPoster"
    );
    return res.json(toPayload(item));
  } catch (err) {
    return res.status(500).json({ message: "Failed to update watchlist status" });
  }
}

// Updates favorite flag for an existing watchlist row.
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

// Removes an anime from the signed-in user's watchlist.
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
  updateWatchlistStatus,
  updateWatchlistFavorite,
  deleteWatchlistItem,
};
