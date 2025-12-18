const Review = require("../models/Review");

function validateRating(rating) {
  if (rating === undefined || rating === null) return true;
  return typeof rating === "number" && rating >= 1 && rating <= 10;
}

function validateText(text) {
  return typeof text === "string" && text.trim().length >= 5 && text.trim().length <= 2000;
}

// GET /api/reviews/anime/:animeId
async function listReviewsForAnime(req, res) {
  const { animeId } = req.params;
  try {
    const reviews = await Review.find({ animeId })
      .sort({ createdAt: -1 })
      .populate("userId", "username")
      .lean();
    return res.json(
      reviews.map((r) => ({
        _id: r._id,
        animeId: r.animeId,
        userId: r.userId?._id ?? r.userId,
        username: r.userId?.username ?? "Unknown",
        rating: r.rating,
        text: r.text,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }))
    );
  } catch (err) {
    return res.status(500).json({ message: "Failed to load reviews" });
  }
}

// POST /api/reviews/anime/:animeId
async function createReview(req, res) {
  const { animeId } = req.params;
  const { rating, text } = req.body || {};

  if (!validateText(text)) {
    return res.status(400).json({ message: "Review text must be 5-2000 characters" });
  }
  if (!validateRating(rating)) {
    return res.status(400).json({ message: "Rating must be between 1 and 10" });
  }

  try {
    const existing = await Review.findOne({ animeId, userId: req.user.id });
    if (existing) {
      return res.status(409).json({ message: "You already reviewed this anime" });
    }

    const review = await Review.create({
      animeId,
      userId: req.user.id,
      rating: rating ?? undefined,
      text: text.trim(),
    });

    return res.status(201).json(review);
  } catch (err) {
    return res.status(500).json({ message: "Failed to create review" });
  }
}

// PATCH /api/reviews/:reviewId
async function updateReview(req, res) {
  const { reviewId } = req.params;
  const { rating, text } = req.body || {};

  if (rating !== undefined && !validateRating(rating)) {
    return res.status(400).json({ message: "Rating must be between 1 and 10" });
  }
  if (text !== undefined && !validateText(text)) {
    return res.status(400).json({ message: "Review text must be 5-2000 characters" });
  }

  try {
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });
    if (review.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (text !== undefined) review.text = text.trim();
    if (rating !== undefined) review.rating = rating;

    await review.save();
    return res.json(review);
  } catch (err) {
    return res.status(500).json({ message: "Failed to update review" });
  }
}

// DELETE /api/reviews/:reviewId
async function deleteReview(req, res) {
  const { reviewId } = req.params;
  try {
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });
    if (review.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await Review.deleteOne({ _id: reviewId });
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete review" });
  }
}

module.exports = {
  listReviewsForAnime,
  createReview,
  updateReview,
  deleteReview,
};
