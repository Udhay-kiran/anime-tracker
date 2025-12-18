const express = require("express");
const {
  getWatchlist,
  addWatchlistItem,
  updateWatchlistItem,
  updateWatchlistFavorite,
  deleteWatchlistItem,
} = require("../controllers/watchlistController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, getWatchlist);
router.post("/", requireAuth, addWatchlistItem);
router.patch("/:animeId", requireAuth, updateWatchlistItem);
router.patch("/:animeId/favorite", requireAuth, updateWatchlistFavorite);
router.delete("/:animeId", requireAuth, deleteWatchlistItem);

module.exports = router;
