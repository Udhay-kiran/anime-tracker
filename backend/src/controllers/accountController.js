const Watchlist = require("../models/Watchlist");
const User = require("../models/User");

async function getAccountSummary(req, res) {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const items = await Watchlist.find({ userId: req.user.id }).populate(
      "animeId",
      "genres"
    );

    const statusCounts = { planned: 0, watching: 0, completed: 0, dropped: 0 };
    const genreCounts = {};

    items.forEach((item) => {
      statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;

      const genres = Array.isArray(item.animeId?.genres) ? item.animeId.genres : [];
      genres.forEach((genreRaw) => {
        const genre = genreRaw || "Unknown";
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    });

    const sortedGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]);
    const topGenres = sortedGenres.slice(0, 3).map(([genre, count]) => ({ genre, count }));
    const mostWatchedGenre = sortedGenres.length ? sortedGenres[0][0] : null;

    return res.json({
      user: { username: user.username, email: user.email, dob: user.dob },
      stats: {
        total: items.length,
        byStatus: statusCounts,
        mostWatchedGenre,
        topGenres,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load account summary" });
  }
}

module.exports = { getAccountSummary };
