"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import AnimeCard, { AnimeCardAnime } from "@/components/AnimeCard";
import { apiBase } from "@/lib/apiBase";
import { apiFetch } from "@/lib/api";
import SortDropdown from "@/components/SortDropdown";

type Anime = AnimeCardAnime & {
  synopsis: string;
  status: string;
};

type WatchStatus = "planned" | "watching" | "completed" | "dropped";
type WatchlistEntry = { status: WatchStatus; favorite: boolean };

function toWatchStatus(value: unknown): WatchStatus {
  const v = String(value || "").toLowerCase();
  if (v === "watching" || v === "watching now") return "watching";
  if (v === "completed" || v === "finished") return "completed";
  if (v === "dropped") return "dropped";
  if (v === "planned") return "planned";
  return "planned";
}
type WatchlistResponseItem = { anime: Anime; status: string; favorite?: boolean };

type FetchState = "loading" | "error" | "ready";

export default function BrowseClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const API_BASE = apiBase();

  const [anime, setAnime] = useState<Anime[]>([]);
  const [state, setState] = useState<FetchState>("loading");
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [genre, setGenre] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [year, setYear] = useState<string>("all");
  const [sort, setSort] = useState<string>("rating_desc");
  const [visibleCount, setVisibleCount] = useState(8);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

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

        const response = await fetch(`${API_BASE}/api/anime`, {
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
        const res = await apiFetch(`${API_BASE}/api/watchlist`, {
          cache: "no-store",
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
          if (id)
            map[id] = { status: toWatchStatus(item.status), favorite: Boolean(item.favorite) };
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

  const optionClass = "bg-[#0f0b24] text-white";

  const defaultSort = "rating_desc";
  const filtersAppliedCount =
    (genre !== "all" ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (year !== "all" ? 1 : 0);
  const resetFilters = () => {
    setQuery("");
    setSearchInput("");
    setGenre("all");
    setStatusFilter("all");
    setYear("all");
    setSort(defaultSort);
    setVisibleCount(8);
    if (searchParams?.get("slugs") || searchParams?.get("panel")) {
      router.push("/browse");
    }
  };

  useEffect(() => {
    if (!searchParams) return;
    const sortParam = searchParams.get("sort");
    const statusParam = searchParams.get("status");
    const yearParam = searchParams.get("year");

    if (sortParam === "rating_desc" && sort !== "rating_desc") {
      setSort("rating_desc");
    }

    if (statusParam === "upcoming" && statusFilter !== "coming_soon") {
      setStatusFilter("coming_soon");
    }

    if (yearParam && yearOptions.includes(Number(yearParam)) && year !== yearParam) {
      setYear(yearParam);
    }
  }, [searchParams, sort, statusFilter, year, yearOptions]);

  // Debounce search input for all viewports
  useEffect(() => {
    const handle = setTimeout(() => {
      setQuery(searchInput);
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  // Body scroll lock when mobile filters are open
  useEffect(() => {
    if (!filtersOpen) return undefined;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [filtersOpen]);

  // Close on Escape
  useEffect(() => {
    if (!filtersOpen) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFiltersOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtersOpen]);

  const handleApplyMobile = () => {
    setFiltersOpen(false);
  };

  const slugsParam = searchParams?.get("slugs");
  const panelSlugs = useMemo(
    () => (slugsParam ? slugsParam.split(",").map((s) => decodeURIComponent(s)) : null),
    [slugsParam],
  );

  const filtered = useMemo(() => {
    const base = panelSlugs ? anime.filter((item) => panelSlugs.includes(item.slug)) : [...anime];
    let list = [...base];

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
        list.sort((a, b) => (b.releaseYear ?? 0) - (a.releaseYear ?? 0));
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
  }, [anime, genre, query, sort, statusFilter, year, panelSlugs]);

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
        ? `${API_BASE}/api/watchlist/${animeId}`
        : `${API_BASE}/api/watchlist`;
      const options: RequestInit = inList
        ? { method: "DELETE" }
        : {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ animeId, status: "planned" }),
          };

      try {
        const res = await apiFetch(url, options);
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
        console.error(err);
      } finally {
        setWatchlistLoading((prev) => ({ ...prev, [animeId]: false }));
      }
    },
    [API_BASE, isAuthed, router, watchlist]
  );

  const toggleFavorite = useCallback(
    async (animeId: string) => {
      if (!animeId) return;
      const key = String(animeId);
      if (isAuthed === false) {
        router.push("/login");
        return;
      }

      const entry = watchlist[key];
      const nextFavorite = !(entry?.favorite ?? false);
      setFavoriteLoading((prev) => ({ ...prev, [key]: true }));

      const revert = () =>
        setWatchlist((prev) => {
          if (!entry) {
            const next = { ...prev };
            delete next[key];
            return next;
          }
          return { ...prev, [key]: entry };
        });

      if (!entry) {
        setWatchlist((prev) => ({
          ...prev,
          [key]: { status: "planned", favorite: nextFavorite },
        }));
        try {
          const res = await apiFetch(`${API_BASE}/api/watchlist`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ animeId, favorite: nextFavorite }),
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
            [key]: {
              status: toWatchStatus(data.status),
              favorite: Boolean(data.favorite),
            },
          }));
        } catch (err) {
          console.error(err);
          revert();
        } finally {
          setFavoriteLoading((prev) => ({ ...prev, [key]: false }));
        }
        return;
      }

      setWatchlist((prev) => ({
        ...prev,
        [key]: { ...entry, favorite: nextFavorite },
      }));
      try {
        const res = await apiFetch(`${API_BASE}/api/watchlist/${animeId}/favorite`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
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
          [key]: {
            status: toWatchStatus(data.status ?? entry.status),
            favorite: Boolean(data.favorite),
          },
        }));
      } catch (err) {
        console.error(err);
        revert();
      } finally {
        setFavoriteLoading((prev) => ({ ...prev, [key]: false }));
      }
    },
    [API_BASE, isAuthed, router, watchlist]
  );

  const handleLoadMore = useCallback(() => {
    setLoadingMore(true);
    setVisibleCount((prev) => Math.min(prev + 8, filtered.length));
    setTimeout(() => setLoadingMore(false), 150);
  }, [filtered.length]);

  const content = useMemo(() => {
    if (state === "loading") {
      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {visibleAnime.map((item, index) => {
            const id = item._id ?? item.slug;
            const watchlistEntry = id ? watchlist[id] : undefined;
            return (
              <div
                key={id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <AnimeCard
                  anime={item}
                  isWatchlisted={Boolean(watchlistEntry)}
                  watchlistLoading={Boolean(id && (watchlistLoading[id] || favoriteLoading[id]))}
                  isFavorite={Boolean(watchlistEntry?.favorite)}
                  showFavorite
                  onToggleWatchlist={toggleWatchlist}
                  onToggleFavorite={toggleFavorite}
                  statusLabel={watchlistEntry?.status}
                />
              </div>
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

  const filterControls = (
    <div className="grid gap-3 md:grid-cols-3">
      <div className="md:col-span-2 hidden md:block">
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
          Search
        </label>
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by title..."
          className="mt-2 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/60 shadow-sm backdrop-blur-md appearance-none [-webkit-appearance:none] [-moz-appearance:none] focus:border-indigo-400 focus:outline-none"
        />
      </div>
      <div className="hidden md:block">
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
          Sort by
        </label>
        <div className="relative mt-2">
          <SortDropdown value={sort} onChange={setSort} />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
          Genre
        </label>
        <div className="relative mt-2">
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="anilog-select w-full rounded-xl border border-white/10 bg-[rgba(10,12,24,0.55)] px-3 py-2 pr-10 text-sm text-white shadow-sm backdrop-blur-md appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-300/30 focus:border-indigo-300/30"
          >
            <option className={optionClass} value="all">
              All
            </option>
            {genreOptions.map((g) => (
              <option className={optionClass} key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
          Status
        </label>
        <div className="relative mt-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="anilog-select w-full rounded-xl border border-white/10 bg-[rgba(10,12,24,0.55)] px-3 py-2 pr-10 text-sm text-white shadow-sm backdrop-blur-md appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-300/30 focus:border-indigo-300/30"
          >
            <option className={optionClass} value="all">
              All
            </option>
            <option className={optionClass} value="airing">
              Airing
            </option>
            <option className={optionClass} value="finished">
              Finished
            </option>
            <option className={optionClass} value="coming_soon">
              Coming soon
            </option>
            <option className={optionClass} value="hiatus">
              Hiatus
            </option>
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
          Year
        </label>
        <div className="relative mt-2">
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="anilog-select w-full rounded-xl border border-white/10 bg-[rgba(10,12,24,0.55)] px-3 py-2 pr-10 text-sm text-white shadow-sm backdrop-blur-md appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-300/30 focus:border-indigo-300/30"
          >
            <option className={optionClass} value="all">
              All
            </option>
            {yearOptions.map((y) => (
              <option className={optionClass} key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
      <div className="hidden md:block">
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
          Quick actions
        </label>
        {filtersAppliedCount > 0 ? (
          <div className="mt-2 hidden items-center gap-3 md:flex">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/80 shadow-sm">
              {filtersAppliedCount} {filtersAppliedCount === 1 ? "filter" : "filters"} applied
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white transition hover:border-indigo-300 hover:text-white"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="mt-2 hidden md:flex text-xs text-white/50">No filters applied</div>
        )}
      </div>
    </div>
  );

  const mobileControls = (
    <div className="md:hidden sticky top-0 z-40 -mx-6 px-6 pt-3 pb-3 space-y-3 border-b border-white/10 bg-black/60 backdrop-blur-md">
      <div>
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by title..."
          className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/60 shadow-sm backdrop-blur-md appearance-none [-webkit-appearance:none] [-moz-appearance:none] focus:border-indigo-300 focus:outline-none"
        />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <SortDropdown value={sort} onChange={setSort} />
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="shrink-0 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-md transition hover:border-indigo-300 hover:text-white"
        >
          Filters
        </button>
        <span className="shrink-0 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/80 shadow-sm">
          {filtered.length} results
        </span>
      </div>
    </div>
  );

  return (
    <main
      className="relative min-h-screen overflow-x-hidden text-white"
      style={{
        backgroundImage:
          "linear-gradient(145deg, rgba(69,38,160,0.02), rgba(20,14,62,0.10) 38%, rgba(7,7,20,0.12)), url('/bg/anilog-bg.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="mx-auto max-w-6xl px-6 pt-8 pb-12 md:py-12">
        <header className="mb-4 flex flex-col gap-3 md:mb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
              Discover
            </p>
            <h1 className="text-3xl font-semibold md:text-4xl">Browse anime</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/80 md:text-base">
              Filter by genre, status, and year while sorting by rating or title.
            </p>
            {panelSlugs && (
              <div className="mt-2 flex items-center gap-3">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/85">
                  Showing: {searchParams?.get("panel") === "topRated" ? "Top rated" : "Trending"}
                </span>
                <Link
                  href="/browse"
                  className="text-xs font-semibold text-indigo-200 underline underline-offset-4"
                >
                  Clear preset
                </Link>
              </div>
            )}
          </div>
        </header>

        {mobileControls}
        {filtersAppliedCount > 0 && (
          <div className="-mx-6 px-6 mt-2 mb-4 md:hidden flex items-center justify-between text-xs font-semibold text-white/80">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 shadow-sm">
              {filtersAppliedCount} {filtersAppliedCount === 1 ? "filter" : "filters"} applied
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:border-indigo-300 hover:text-white"
            >
              Reset
            </button>
          </div>
        )}

        <div className="hidden rounded-2xl border border-white/10 bg-white/10 p-5 shadow-lg backdrop-blur lg:block">
          {filterControls}
        </div>

        {filtersOpen && (
          <div
            className="fixed inset-0 z-60 flex items-end bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setFiltersOpen(false)}
          >
            <div
              className="w-full max-h-[80vh] rounded-t-3xl border border-white/15 bg-[#0d0a1f]/95 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.6)] transition-transform duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-white/80">Filters</div>
                <button
                  type="button"
                  aria-label="Close filters"
                  onClick={() => setFiltersOpen(false)}
                  className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 transition hover:border-indigo-300 hover:text-white"
                >
                  x
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto pr-1">{filterControls}</div>
              <div className="mt-4 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-indigo-300 hover:text-white"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleApplyMobile}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">{content}</div>
      </div>
    </main>
  );
}
