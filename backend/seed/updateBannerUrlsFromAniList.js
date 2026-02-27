
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const Anime = require("../src/models/Anime");

const ANILIST_API = "https://graphql.anilist.co";

// Small delay between requests to avoid hammering AniList.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function connectDB() {
  const uri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL ||
    process.env.MONGO_URL;

  if (!uri) {
    console.error(
      "❌ No MongoDB URI found. Set MONGO_URI (or MONGODB_URI) in backend/.env"
    );
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("✅ MongoDB connected");
}

async function fetchAniListMediaByTitle(title) {
  // Search AniList by title and return banner metadata.
  const query = `
    query ($search: String) {
      Media(search: $search, type: ANIME) {
        id
        title { romaji english native }
        bannerImage
        coverImage { extraLarge large medium }
        siteUrl
      }
    }
  `;

  const res = await fetch(ANILIST_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { search: title },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AniList HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json();

  if (json.errors?.length) {
    throw new Error(`AniList GraphQL error: ${JSON.stringify(json.errors[0])}`);
  }

  return json.data?.Media || null;
}

function pickBannerUrl(media) {
  // Keep only bannerImage for this field.
  if (!media) return null;
  return media.bannerImage || null;
}

async function run() {
  await connectDB();

  // Update only entries missing a banner URL.
  const animes = await Anime.find({
    $or: [{ bannerUrl: { $exists: false } }, { bannerUrl: "" }],
  });

  console.log(`🔎 Found ${animes.length} anime(s) needing bannerUrl`);

  let updated = 0;
  let skippedNoBanner = 0;
  let failed = 0;

  for (const anime of animes) {
    const title = anime.title;

    try {
      const media = await fetchAniListMediaByTitle(title);
      const banner = pickBannerUrl(media);

      if (!banner) {
        skippedNoBanner++;
        console.log(`⚠️  No bannerImage on AniList: ${title}`);
      } else {
        anime.bannerUrl = banner;
        await anime.save();
        updated++;
        console.log(`🖼️  Updated banner: ${title}`);
      }

      // Rate limit between successful calls.
      await sleep(450);
    } catch (err) {
      failed++;
      console.log(`❌ Failed: ${title} -> ${err.message}`);
      await sleep(800);
    }
  }

  console.log("\n==== Summary ====");
  console.log(`✅ Updated: ${updated}`);
  console.log(`⚠️  No banner on AniList: ${skippedNoBanner}`);
  console.log(`❌ Failed requests: ${failed}`);

  await mongoose.disconnect();
  console.log("🔌 MongoDB disconnected");
}

run().catch((e) => {
  console.error("❌ Script crashed:", e);
  process.exit(1);
});
