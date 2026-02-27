const Favorite = require("../models/Favorite");

// Returns favorite anime ids for the signed-in user.
async function listFavorites(req, res) {
  try {
    const favorites = await Favorite.find({ userId: req.user.id }).lean();
    return res.json({ animeIds: favorites.map((f) => f.animeId?.toString()).filter(Boolean) });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load favorites" });
  }
}

// Adds one anime to favorites (idempotent).
async function addFavorite(req, res) {
  const { animeId } = req.params;
  if (!animeId) return res.status(400).json({ message: "animeId is required" });
  try {
    await Favorite.updateOne(
      { userId: req.user.id, animeId },
      { $setOnInsert: { userId: req.user.id, animeId } },
      { upsert: true }
    );
    return res.status(201).json({ animeId });
  } catch (err) {
    return res.status(500).json({ message: "Failed to add favorite" });
  }
}

// Removes one anime from favorites.
async function removeFavorite(req, res) {
  const { animeId } = req.params;
  if (!animeId) return res.status(400).json({ message: "animeId is required" });
  try {
    await Favorite.deleteOne({ userId: req.user.id, animeId });
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ message: "Failed to remove favorite" });
  }
}

module.exports = { listFavorites, addFavorite, removeFavorite };
