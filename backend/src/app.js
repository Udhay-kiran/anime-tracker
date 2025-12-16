const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const animeRoutes = require("./routes/animeRoutes");
console.log("animeRoutes type:", typeof animeRoutes, animeRoutes);
const app = express(); 

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/anime", animeRoutes);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Backend is running ✅" });
});

module.exports = app;
