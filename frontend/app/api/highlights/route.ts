import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type HighlightsPayload = {
  topRated: unknown[];
  trending: unknown[];
  recent2025: unknown[];
  comingSoon: unknown[];
};

const API_BASE = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

async function fetchCategory(url: string, key?: string) {
  const result: { items: unknown[]; status: number } = { items: [], status: 0 };
  try {
    const res = await fetch(url, { cache: "no-store" });
    result.status = res.status;
    if (!res.ok) {
      console.error(`[highlights] fetch failed ${url} -> ${res.status}`);
      return result;
    }
    const data = await res.json();

    const candidates: unknown[] = [];
    if (Array.isArray(data)) candidates.push(data);
    if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      const maybeArrays = [
        obj.data,
        obj.items,
        obj.results,
        obj.animes,
        obj.anime,
        obj.highlights,
        key ? obj[key] : undefined,
        key && obj.data && typeof obj.data === "object" ? (obj.data as Record<string, unknown>)[key!] : undefined,
        key && obj.highlights && typeof obj.highlights === "object"
          ? (obj.highlights as Record<string, unknown>)[key!]
          : undefined,
      ];
      for (const candidate of maybeArrays) {
        if (Array.isArray(candidate)) {
          candidates.push(candidate);
        }
      }
    }

    const array = candidates.find((c) => Array.isArray(c)) as unknown[] | undefined;
    result.items = array ? array.slice(0, 6) : [];
    return result;
  } catch (err) {
    console.error(`[highlights] fetch error ${url}`, err);
    return result;
  }
}

export async function GET() {
  const endpoints = {
    topRated: `${API_BASE}/api/anime/highlights`,
    trending: `${API_BASE}/api/anime/highlights`,
    recent2025: `${API_BASE}/api/external/highlights?category=recent2025`,
    comingSoon: `${API_BASE}/api/external/highlights?category=comingSoon`,
  };

  const [topRatedRes, trendingRes, recentRes, comingRes] = await Promise.all([
    fetchCategory(endpoints.topRated, "topRated"),
    fetchCategory(endpoints.trending, "trending"),
    fetchCategory(endpoints.recent2025),
    fetchCategory(endpoints.comingSoon),
  ]);

  const highlights: HighlightsPayload = {
    topRated: topRatedRes.items,
    trending: trendingRes.items,
    recent2025: recentRes.items,
    comingSoon: comingRes.items,
  };

  const debug =
    process.env.NODE_ENV !== "production"
      ? {
          endpoints,
          status: {
            topRated: topRatedRes.status,
            trending: trendingRes.status,
            recent2025: recentRes.status,
            comingSoon: comingRes.status,
          },
        }
      : undefined;

  return NextResponse.json(debug ? { highlights, debug } : { highlights });
}
