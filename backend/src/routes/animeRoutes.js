const express = require("express");
const {
  listAnime,
  getAnimeById,
  getAnimeBySlug,
  getAnimeHighlights,
} = require("../controllers/animeController");

const router = express.Router();

router.get("/", listAnime);
router.get("/highlights", getAnimeHighlights);
router.get("/slug/:slug", getAnimeBySlug);
router.get("/:id", getAnimeById);

module.exports = router;
