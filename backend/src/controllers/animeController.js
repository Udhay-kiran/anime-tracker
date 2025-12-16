const Anime = require("../models/Anime");

// GET /api/anime
async function listAnime(req, res) {
  const animes = await Anime.find().sort({ releaseYear: -1, title: 1 });
  res.json(animes);
}

// GET /api/anime/:id  (Mongo _id)
async function getAnimeById(req, res) {
  const anime = await Anime.findById(req.params.id);
  if (!anime) return res.status(404).json({ message: "Anime not found" });
  res.json(anime);
}

module.exports = { listAnime, getAnimeById };
