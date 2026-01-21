const ANILIST_URL = "https://graphql.anilist.co";
const PER_PAGE = 6;

const QUERIES = {
  recent2025: `
    query ($perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, seasonYear: 2025, sort: POPULARITY_DESC) {
          id
          title { romaji english }
          seasonYear
          status
          averageScore
          coverImage { large }
        }
      }
    }
  `,
  comingSoon: `
    query ($perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC) {
          id
          title { romaji english }
          seasonYear
          status
          averageScore
          coverImage { large }
        }
      }
    }
  `,
};

async function getExternalHighlights(req, res) {
  const { category } = req.query;
  if (category !== "recent2025" && category !== "comingSoon") {
    return res.status(400).json({ error: "Invalid category" });
  }

  const query = QUERIES[category];

  try {
    const response = await fetch(ANILIST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables: { perPage: PER_PAGE } }),
    });

    if (!response.ok) {
      return res.json([]);
    }

    const payload = await response.json();
    const media = payload?.data?.Page?.media || [];

    const normalized = media.map((item) => {
      const title = item?.title?.english || item?.title?.romaji || "Untitled";
      const releaseYear = item?.seasonYear ?? null;
      const status = item?.status ?? null;
      const avgScore = typeof item?.averageScore === "number" ? item.averageScore : null;
      const avgRating = avgScore === null ? null : Number((avgScore / 10).toFixed(1));
      const posterUrl = item?.coverImage?.large || null;
      return {
        source: "anilist",
        externalId: `anilist:${item?.id}`,
        title,
        releaseYear,
        status,
        avgRating,
        posterUrl,
      };
    });

    res.json(normalized.slice(0, PER_PAGE));
  } catch (err) {
    res.json([]);
  }
}

module.exports = { getExternalHighlights };
