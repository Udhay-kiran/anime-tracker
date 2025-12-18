const express = require("express");
const { listFavorites, addFavorite, removeFavorite } = require("../controllers/favoriteController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, listFavorites);
router.post("/:animeId", requireAuth, addFavorite);
router.delete("/:animeId", requireAuth, removeFavorite);

module.exports = router;
