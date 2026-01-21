"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import AnimeCard, { AnimeCardAnime } from "@/components/AnimeCard";

type Anime = AnimeCardAnime & {
  synopsis: string;
  status: string;
};

type WatchlistEntry = { status: string; favorite: boolean };
type WatchlistResponseItem = { anime: Anime; status: string; favorite?: boolean };

type FetchState = "loading" | "error" | "ready";

export default function BrowsePage() {
  const router = useRouter();
  const [anime, setAnime] = useState<Anime[]>([]);
  const [state, setState] = useState<FetchState>("loading");
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [year, setYear] = useState<string>("all");
  const [sort, setSort] = useState<string>("rating_desc");
  const [visibleCount, setVisibleCount] = useState(8);
  const [loadingMore, setLoadingMore] = useState(false);

  const [watchlist, setWatchlist] = useState<Record<string, WatchlistEntry>>({});
  const [watchlistLoading, setWatchlistLoading] = useState<Record<string, boolean>>({});
  const [favoriteLoading, setFavoriteLoading] = useState<Record<string, boolean>>({});
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadAnime = async () => {
      try {
        setState("loading");
        setError(null);

        const response = await fetch("http://localhost:4000/api/anime", {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data: Anime[] = await response.json();
        setAnime(data);
        setState("ready");
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError((err as Error).message || "Failed to load anime.");
        setState("error");
      }
    };

    loadAnime();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadWatchlist = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/watchlist", {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        });
        if (res.status === 401) {
          setIsAuthed(false);
          setWatchlist({});
          return;
        }
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data: WatchlistResponseItem[] = await res.json();
        const map: Record<string, WatchlistEntry> = {};
        data.forEach((item) => {
          const id = item.anime?._id;
          if (id) map[id] = { status: item.status, favorite: Boolean(item.favorite) };
        });
        setWatchlist(map);
        setIsAuthed(true);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setIsAuthed((prev) => (prev === false ? prev : null));
      }
    };
    loadWatchlist();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    setVisibleCount(8);
  }, [query, genre, statusFilter, year, sort]);

  const genreOptions = useMemo(() => {
    const set = new Set<string>();
    anime.forEach((item) => item.genres?.forEach((g) => set.add(g)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [anime]);

  const yearOptions = useMemo(() => {
    const set = new Set<number>();
    anime.forEach((item) => {
      if (item.releaseYear) set.add(item.releaseYear);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [anime]);

  const filtered = useMemo(() => {
    let list = [...anime];

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((item) => item.title.toLowerCase().includes(q));
    }

    if (genre !== "all") {
      list = list.filter((item) =>
        item.genres?.some((g) => g.toLowerCase() === genre.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      list = list.filter((item) => item.status === statusFilter);
    }

    if (year !== "all") {
      const selectedYear = Number(year);
      list = list.filter((item) => item.releaseYear === selectedYear);
    }

    switch (sort) {
      case "year_desc":
        list.sort(
          (a, b) => (b.releaseYear ?? 0) - (a.releaseYear ?? 0)
        );
        break;
      case "title_asc":
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "rating_desc":
      default:
        list.sort((a, b) => (b.avgRating ?? -Infinity) - (a.avgRating ?? -Infinity));
        break;
    }

    return list;
  }, [anime, genre, query, sort, statusFilter, year]);

  const visibleAnime = useMemo(
    () => filtered.slice(0, Math.min(visibleCount, filtered.length)),
    [filtered, visibleCount]
  );

  const toggleWatchlist = useCallback(
    async (animeId: string) => {
      if (!animeId) return;
      if (isAuthed === false) {
        router.push("/login");
        return;
      }

      setWatchlistLoading((prev) => ({ ...prev, [animeId]: true }));
      const inList = Boolean(watchlist[animeId]);
      const url = inList
        ? `http://localhost:4000/api/watchlist/${animeId}`
        : "http://localhost:4000/api/watchlist";
      const options: RequestInit = inList
        ? { method: "DELETE", credentials: "include" }
        : {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ animeId, status: "planned" }),
          };

      try {
        const res = await fetch(url, options);
        if (res.status === 401) {
          setIsAuthed(false);
          router.push("/login");
          return;
        }
        if (!res.ok && !(inList && res.status === 404)) {
          throw new Error(`Request failed (${res.status})`);
        }

        if (inList) {
          setWatchlist((prev) => {
            const next = { ...prev };
            delete next[animeId];
            return next;
          });
        } else {
          const payload = (await res.json().catch(() => null)) as
            | WatchlistResponseItem
            | null;
          setWatchlist((prev) => ({
            ...prev,
            [animeId]: {
              status: payload?.status ?? "planned",
              favorite: Boolean(payload?.favorite),
            },
          }));
        }
      } catch (err) {
        // silently ignore errors to keep UI simple
        console.error(err);
      } finally {
        setWatchlistLoading((prev) => ({ ...prev, [animeId]: false }));
      }
    },
    [isAuthed, router, watchlist]
  );

  const toggleFavorite = useCallback(
    async (animeId: string) => {
      if (!animeId) return;
      if (isAuthed === false) {
        router.push("/login");
        return;
      }

      const entry = watchlist[animeId];
      const nextFavorite = !(entry?.favorite ?? false);
      setFavoriteLoading((prev) => ({ ...prev, [animeId]: true }));

      const revert = () =>
        setWatchlist((prev) => {
          if (!entry) {
            const next = { ...prev };
            delete next[animeId];
            return next;
          }
          return { ...prev, [animeId]: entry };
        });

      // Case 1: not in watchlist yet — create as completed + favorite
      if (!entry) {
        setWatchlist((prev) => ({
          ...prev,
          [animeId]: { status: "completed", favorite: nextFavorite },
        }));
        try {
          const res = await fetch("http://localhost:4000/api/watchlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ animeId, status: "completed", favorite: nextFavorite }),
          });
          if (res.status === 401) {
            setIsAuthed(false);
            router.push("/login");
            return;
          }
          if (!res.ok) throw new Error(`status ${res.status}`);
          const data: WatchlistResponseItem = await res.json();
          setWatchlist((prev) => ({
            ...prev,
            [animeId]: { status: data.status ?? "completed", favorite: Boolean(data.favorite) },
          }));
        } catch (err) {
          console.error(err);
          revert();
        } finally {
          setFavoriteLoading((prev) => ({ ...prev, [animeId]: false }));
        }
        return;
      }

      // Case 2: in watchlist but not completed — promote to completed, then favorite
      if (entry.status !== "completed") {
        setWatchlist((prev) => ({
          ...prev,
          [animeId]: { status: "completed", favorite: nextFavorite },
        }));
        try {
          const statusRes = await fetch(`http://localhost:4000/api/watchlist/${animeId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ status: "completed" }),
          });
          if (statusRes.status === 401) {
            setIsAuthed(false);
            router.push("/login");
            return;
          }
          if (!statusRes.ok) throw new Error(`status ${statusRes.status}`);
          const favRes = await fetch(`http://localhost:4000/api/watchlist/${animeId}/favorite`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ favorite: nextFavorite }),
          });
          if (favRes.status === 401) {
            setIsAuthed(false);
            router.push("/login");
            return;
          }
          if (!favRes.ok) throw new Error(`status ${favRes.status}`);
          const data: WatchlistResponseItem = await favRes.json();
          setWatchlist((prev) => ({
            ...prev,
            [animeId]: {
              status: data.status ?? "completed",
              favorite: Boolean(data.favorite),
            },
          }));
        } catch (err) {
          console.error(err);
          revert();
        } finally {
          setFavoriteLoading((prev) => ({ ...prev, [animeId]: false }));
        }
        return;
      }

      // Case 3: already completed — simple toggle
      setWatchlist((prev) => ({
        ...prev,
        [animeId]: { ...entry, favorite: nextFavorite },
      }));
      try {
        const res = await fetch(`http://localhost:4000/api/watchlist/${animeId}/favorite`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ favorite: nextFavorite }),
        });
        if (res.status === 401) {
          setIsAuthed(false);
          router.push("/login");
          return;
        }
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data: WatchlistResponseItem = await res.json();
        setWatchlist((prev) => ({
          ...prev,
          [animeId]: {
            status: data.status ?? entry.status,
            favorite: Boolean(data.favorite),
          },
        }));
      } catch (err) {
        console.error(err);
        revert();
      } finally {
        setFavoriteLoading((prev) => ({ ...prev, [animeId]: false }));
      }
    },
    [isAuthed, router, watchlist]
  );

  const handleLoadMore = useCallback(() => {
    setLoadingMore(true);
    setVisibleCount((prev) => Math.min(prev + 8, filtered.length));
    setTimeout(() => setLoadingMore(false), 150);
  }, [filtered.length]);

  const content = useMemo(() => {
    if (state === "loading") {
      return (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-zinc-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm"
            >
              <div className="mb-3 h-5 w-2/3 animate-pulse rounded bg-zinc-200" />
              <div className="mb-2 h-4 w-full animate-pulse rounded bg-zinc-200" />
              <div className="mb-2 h-4 w-5/6 animate-pulse rounded bg-zinc-200" />
              <div className="mt-4 flex items-center justify-between">
                <div className="h-4 w-20 animate-pulse rounded bg-zinc-200" />
                <div className="h-8 w-16 animate-pulse rounded-full bg-zinc-200" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (state === "error") {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error || "Something went wrong while fetching anime."}
        </div>
      );
    }

    if (!filtered.length) {
      return (
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
          No anime match the selected filters.
        </div>
      );
    }

    return (
      <>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {visibleAnime.map((item) => {
            const id = item._id ?? item.slug;
            const watchlistEntry = id ? watchlist[id] : undefined;
            return (
              <AnimeCard
                key={id}
                anime={item}
                isWatchlisted={Boolean(watchlistEntry)}
                watchlistLoading={Boolean(id && (watchlistLoading[id] || favoriteLoading[id]))}
                isFavorite={Boolean(watchlistEntry?.favorite)}
                showFavorite
                onToggleWatchlist={toggleWatchlist}
                onToggleFavorite={toggleFavorite}
                statusLabel={watchlistEntry?.status}
              />
            );
          })}
        </div>
        {visibleCount < filtered.length && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:opacity-60"
            >
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
      </>
    );
  }, [
    error,
    filtered,
    loadingMore,
    state,
    favoriteLoading,
    handleLoadMore,
    toggleFavorite,
    toggleWatchlist,
    visibleAnime,
    visibleCount,
    watchlist,
    watchlistLoading,
  ]);

  return (
    <div className="min-h-screen text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
              Discover
            </p>
            <h1 className="text-3xl font-semibold md:text-4xl">Browse anime</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/80 md:text-base">
              Filter by genre, status, and year while sorting by rating or title. Data
              loads straight from the Express API at http://localhost:4000/api/anime.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 text-sm font-semibold text-white/85 md:items-end">
            <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 shadow-sm backdrop-blur">
              {filtered.length} results
            </div>
            <Link href="/#contact" className="transition hover:text-white">
              Contact us
            </Link>
          </div>
        </header>

        <div className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-lg backdrop-blur">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Search
              </label>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title..."
                className="mt-2 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white shadow-sm backdrop-blur focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Sort by
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white shadow-sm backdrop-blur focus:border-indigo-400 focus:outline-none"
              >
                <option value="rating_desc">Rating (high to low)</option>
                <option value="year_desc">Year (newest first)</option>
                <option value="title_asc">Title (A-Z)</option>
              </select>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Genre
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white shadow-sm backdrop-blur focus:border-indigo-400 focus:outline-none"
              >
                <option value="all">All</option>
                {genreOptions.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white shadow-sm backdrop-blur focus:border-indigo-400 focus:outline-none"
              >
                <option value="all">All</option>
                <option value="airing">Airing</option>
                <option value="finished">Finished</option>
                <option value="coming_soon">Coming soon</option>
                <option value="hiatus">Hiatus</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Year
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white shadow-sm backdrop-blur focus:border-indigo-400 focus:outline-none"
              >
                <option value="all">All</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Quick actions
              </label>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setGenre("all");
                    setStatusFilter("all");
                    setYear("all");
                    setSort("rating_desc");
                  }}
                  className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white transition hover:border-indigo-300 hover:text-white"
                >
                  Reset filters
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">{content}</div>
      </div>
    </div>
  );
}
