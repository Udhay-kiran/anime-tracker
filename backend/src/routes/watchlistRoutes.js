const express = require("express");
const {
  getWatchlist,
  addWatchlistItem,
  updateWatchlistStatus,
  updateWatchlistFavorite,
  deleteWatchlistItem,
} = require("../controllers/watchlistController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, getWatchlist);
router.post("/", requireAuth, addWatchlistItem);
router.patch("/:animeId/status", requireAuth, updateWatchlistStatus);
router.patch("/:animeId/favorite", requireAuth, updateWatchlistFavorite);
// Backwards compatibility: legacy route updates status only
router.patch("/:animeId", requireAuth, updateWatchlistStatus);
router.delete("/:animeId", requireAuth, deleteWatchlistItem);

module.exports = router;
