const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const animeRoutes = require("./routes/animeRoutes");
const watchlistRoutes = require("./routes/watchlistRoutes");
const authRoutes = require("./routes/authRoutes");
const accountRoutes = require("./routes/accountRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const externalRoutes = require("./routes/externalRoutes");
const contactRoutes = require("./routes/contact");

const app = express();

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://anilog-tracker.vercel.app",
].filter(Boolean);

if (process.env.FRONTEND_URL) {
  ALLOWED_ORIGINS.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isWhitelisted =
      ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".vercel.app");
    if (isWhitelisted) return callback(null, true);
    return callback(new Error("Not allowed by CORS"), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

app.use("/api/anime", animeRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/external", externalRoutes);
app.use("/api/contact", contactRoutes);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Backend is running." });
});

module.exports = app;
