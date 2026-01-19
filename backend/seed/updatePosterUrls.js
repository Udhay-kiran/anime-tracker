const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const Anime = require("../src/models/Anime");

async function connectDB() {
  const uri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL ||
    process.env.MONGO_URL;

  console.log("🔎 Using Mongo URI env key:", uri ? "FOUND" : "NOT FOUND");

  if (!uri) {
    console.error(
      "❌ No MongoDB URI found. Set one of: MONGO_URI, MONGODB_URI, DATABASE_URL, MONGO_URL in backend/.env"
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  }
}

async function updatePosterUrls() {
  const animes = await Anime.find({});
  let updatedCount = 0;

  for (const anime of animes) {
    if (!anime.posterUrl || anime.posterUrl.trim() === "") {
      anime.posterUrl = `/posters/${anime.slug}.jpg`;
      await anime.save();
      updatedCount++;
      console.log(`🖼️  Updated: ${anime.title} -> ${anime.posterUrl}`);
    }
  }

  console.log(`\n✅ Done. Updated ${updatedCount} anime(s).`);
}

(async function run() {
  await connectDB();
  await updatePosterUrls();
  await mongoose.disconnect();
  console.log("🔌 MongoDB disconnected");
  process.exit(0);
})();
