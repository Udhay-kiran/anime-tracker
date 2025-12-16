const express = require("express");
const { listAnime, getAnimeById } = require("../controllers/animeController");

const router = express.Router();

router.get("/", listAnime);
router.get("/:id", getAnimeById);

module.exports = router;
