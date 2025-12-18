const express = require("express");
const {
  listReviewsForAnime,
  createReview,
  updateReview,
  deleteReview,
} = require("../controllers/reviewController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/anime/:animeId", listReviewsForAnime);
router.post("/anime/:animeId", requireAuth, createReview);
router.patch("/:reviewId", requireAuth, updateReview);
router.delete("/:reviewId", requireAuth, deleteReview);

module.exports = router;
