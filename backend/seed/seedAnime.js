require("dotenv").config();
const mongoose = require("mongoose");
const Anime = require("../src/models/Anime");
const animeData = require("./anime.json");

async function run() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI missing in .env");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB for seeding");

  // Seeding starts from a clean collection.
  await Anime.deleteMany({});
  console.log("🧹 Cleared Anime collection");

  await Anime.insertMany(animeData);
  console.log(`Inserted ${animeData.length} anime`);

  await mongoose.disconnect();
  console.log("Disconnected");
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
