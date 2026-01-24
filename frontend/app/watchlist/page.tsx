"use client";

import { useEffect, useMemo, useState } from "react";
import { apiBase } from "@/lib/apiBase";
import Link from "next/link";

type Anime = {
  _id: string;
  title: string;
  slug: string;
  synopsis: string;
  releaseYear: number;
  avgRating?: number | null;
  posterUrl?: string;
};

type WatchlistItem = {
  _id: string;
  status: string;
  favorite: boolean;
  anime: Anime;
};

type TabKey = "favorites" | "planned" | "watching" | "completed" | "dropped";

const TABS: { key: TabKey; label: string }[] = [
  { key: "favorites", label: "Favorites" },
  { key: "planned", label: "Planned" },
  { key: "watching", label: "Watching now" },
  { key: "completed", label: "Completed" },
  { key: "dropped", label: "Dropped" },
];

const WATCH_STATUSES = [
  { value: "planned", label: "Planned" },
  { value: "watching", label: "Watching" },
  { value: "completed", label: "Completed" },
  { value: "dropped", label: "Dropped" },
];

const CARDS_PER_BATCH = 8;

const STATUS_BADGES: Record<string, string> = {
  planned: "Watchlater",
  watching: "Watching now",
  completed: "Completed",
  dropped: "Dropped",
};

const GLASS_CARD =
  "rounded-2xl border border-white/15 bg-gradient-to-br from-black/30 via-[#140d36]/50 to-[#0c0a23]/60 shadow-[0_18px_50px_rgba(0,0,0,0.45)] ring-1 ring-indigo-400/12 backdrop-blur-xl";
const formatRating = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "N/A";
  return value.toFixed(1);
};

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("favorites");
  const [visibleCount, setVisibleCount] = useState(CARDS_PER_BATCH);
  const API_BASE = apiBase();

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/watchlist`, {
        cache: "no-store",
        credentials: "include",
      });
      if (res.status === 401) {
        throw new Error("Please log in to view your watchlist");
      }
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data: WatchlistItem[] = await res.json();
      setItems(data.map((item) => ({ ...item, favorite: Boolean(item.favorite) })));
    } catch (err) {
      setError((err as Error).message || "Failed to load watchlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  useEffect(() => {
    document.body.classList.add("no-watchlist-overlay");
    return () => document.body.classList.remove("no-watchlist-overlay");
  }, []);

  useEffect(() => {
    setVisibleCount(CARDS_PER_BATCH);
  }, [activeTab]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeTab === "favorites") return item.favorite;
      return item.status === activeTab;
    });
  }, [items, activeTab]);

  const visibleItems = useMemo(
    () => filteredItems.slice(0, visibleCount),
    [filteredItems, visibleCount]
  );

const canLoadMore = visibleCount < filteredItems.length;

  const counts = useMemo<Record<TabKey, number>>(() => {
    const base: Record<TabKey, number> = {
      favorites: 0,
      planned: 0,
      watching: 0,
      completed: 0,
      dropped: 0,
    };
    for (const item of items) {
      if (item.favorite) base.favorites += 1;
      if (item.status === "planned") base.planned += 1;
      if (item.status === "watching") base.watching += 1;
      if (item.status === "completed") base.completed += 1;
      if (item.status === "dropped") base.dropped += 1;
    }
    return base;
  }, [items]);

  const updateStatus = async (animeId: string, status: string) => {
    const previousItem = items.find((item) => item.anime._id === animeId);
    setMutatingId(animeId);
    setError(null);
    setItems((prev) =>
      prev.map((item) =>
        item.anime._id === animeId
          ? { ...item, status, favorite: status === "completed" ? item.favorite : false }
          : item
      )
    );
    try {
      const res = await fetch(`${API_BASE}/api/watchlist/${animeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (res.status === 401) throw new Error("Please log in to update your list");
      if (!res.ok) throw new Error(`Update failed (${res.status})`);
      const data: WatchlistItem = await res.json();
      setItems((prev) =>
        prev.map((item) =>
          item.anime._id === animeId
            ? { ...item, status: data.status, favorite: Boolean(data.favorite) }
            : item
        )
      );
    } catch (err) {
      setError((err as Error).message || "Failed to update status");
      if (previousItem) {
        setItems((prev) =>
          prev.map((item) => (item.anime._id === animeId ? previousItem : item))
        );
      }
    } finally {
      setMutatingId(null);
    }
  };

  const removeItem = async (animeId: string) => {
    const previousItems = items;
    setMutatingId(animeId);
    setError(null);
    setItems((prev) => prev.filter((item) => item.anime._id !== animeId));
    try {
      const res = await fetch(`${API_BASE}/api/watchlist/${animeId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.status === 401) throw new Error("Please log in to update your list");
      if (!res.ok && res.status !== 404) {
        throw new Error(`Delete failed (${res.status})`);
      }
    } catch (err) {
      setError((err as Error).message || "Failed to remove item");
      setItems(previousItems);
    } finally {
      setMutatingId(null);
    }
  };

  const toggleFavorite = async (animeId: string, currentFavorite: boolean) => {
    const item = items.find((entry) => entry.anime._id === animeId);
    if (!item || item.status !== "completed") {
      setError("You can only favorite completed anime.");
      return;
    }

    const nextFavorite = !currentFavorite;
    setMutatingId(animeId);
    setError(null);
    setItems((prev) =>
      prev.map((item) =>
        item.anime._id === animeId ? { ...item, favorite: nextFavorite } : item
      )
    );
    try {
      const res = await fetch(`${API_BASE}/api/watchlist/${animeId}/favorite`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ favorite: nextFavorite }),
      });
      if (res.status === 401) throw new Error("Please log in to update your list");
      if (!res.ok) throw new Error(`Update failed (${res.status})`);
      const data: WatchlistItem = await res.json();
      setItems((prev) =>
        prev.map((item) =>
          item.anime._id === animeId
            ? { ...item, favorite: Boolean(data.favorite) }
            : item
        )
      );
    } catch (err) {
      setError((err as Error).message || "Failed to update favorite");
      setItems((prev) =>
        prev.map((item) =>
          item.anime._id === animeId ? { ...item, favorite: currentFavorite } : item
        )
      );
    } finally {
      setMutatingId(null);
    }
  };

  return (
    <>
      <style jsx global>{`
        .page-overlay {
          display: none !important;
          opacity: 0 !important;
        }
      `}</style>
      <div className="min-h-screen text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-indigo-300">
            My List
          </p>
          <h1 className="text-3xl font-semibold md:text-4xl">Your watchlist</h1>
          <p className="max-w-2xl text-sm text-white/80 md:text-base">
            Organize what to watch next, keep up with ongoing shows, and surface your favorites.
          </p>
          <Link
            href="/#contact"
            scroll={false}
            className="text-sm font-semibold text-white/85 transition hover:text-white"
          >
            Contact us
          </Link>
        </header>

        <div className="mt-8 flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 ${
                  isActive
                    ? "border-indigo-500/80 bg-indigo-600 text-white shadow-sm"
                    : "border-white/20 bg-white/10 text-white hover:border-indigo-300 hover:text-white"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`min-w-[1.75rem] rounded-full px-2 py-0.5 text-xs font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-zinc-100 text-zinc-700"
                  }`}
                >
                  {counts[tab.key]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[...Array(8)].map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-white/15 bg-white/10 p-5 shadow-sm backdrop-blur"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="h-5 w-2/3 animate-pulse rounded bg-zinc-200" />
                    <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-200" />
                  </div>
                  <div className="mb-2 h-4 w-full animate-pulse rounded bg-zinc-200" />
                  <div className="mb-2 h-4 w-5/6 animate-pulse rounded bg-zinc-200" />
                  <div className="mt-4 flex items-center justify-between">
                    <div className="h-4 w-24 animate-pulse rounded bg-zinc-200" />
                    <div className="h-8 w-20 animate-pulse rounded-full bg-zinc-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/20 bg-white/10 px-4 py-6 text-sm text-white/80 backdrop-blur">
              Nothing here yet. Add shows to your list and mark them as favorites or set their
              status to see them appear under each tab.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {visibleItems.map((item) => (
                  <WatchlistCard
                    key={item._id}
                    item={item}
                    mutating={mutatingId === item.anime._id}
                    onFavorite={() => toggleFavorite(item.anime._id, item.favorite)}
                    onStatusChange={(status) => updateStatus(item.anime._id, status)}
                    onRemove={() => removeItem(item.anime._id)}
                  />
                ))}
              </div>
              {canLoadMore && (
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + CARDS_PER_BATCH)}
                    className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
                  >
                    Load more
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

function WatchlistCard({
  item,
  mutating,
  onFavorite,
  onStatusChange,
  onRemove,
}: {
  item: WatchlistItem;
  mutating: boolean;
  onFavorite: () => void;
  onStatusChange: (status: string) => void;
  onRemove: () => void;
}) {
  return (
    <article
      className={`group relative flex h-full flex-row items-stretch ${GLASS_CARD} p-3 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl hover:ring-1 hover:ring-indigo-400/30 md:flex-col md:gap-4 sm:p-5`}
    >
      {item.status === "completed" ? (
        <button
          type="button"
          aria-pressed={item.favorite}
          aria-label={item.favorite ? "Remove heart" : "Add heart"}
          onClick={onFavorite}
          disabled={mutating}
          className={`pointer-events-auto absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full border text-sm transition ${
            item.favorite
              ? "border-rose-300/70 bg-rose-500/25 text-rose-50"
              : "border-white/15 bg-black/35 text-white/90 hover:border-rose-300/40 hover:text-rose-200"
          } ${mutating ? "opacity-60" : ""} backdrop-blur-md`}
        >
          <HeartIcon filled={item.favorite} />
        </button>
      ) : null}

      <div className="w-[84px] h-[116px] shrink-0 overflow-hidden rounded-xl border border-white/12 bg-white/8 shadow-inner md:mx-auto md:h-auto md:w-full md:aspect-[3/4]">
        {item.anime.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.anime.posterUrl} alt={item.anime.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-[11px] font-semibold uppercase tracking-wide text-white/50">
            Poster
          </div>
        )}
      </div>

      <div className="ml-3 flex min-w-0 flex-1 flex-col justify-between md:ml-0 md:mt-4 md:gap-3">
        <div className="min-w-0">
          <Link
            href={`/anime/${item.anime.slug}`}
            className="line-clamp-2 text-sm font-semibold leading-tight text-white transition hover:text-indigo-200 md:text-lg"
          >
            {item.anime.title}
          </Link>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/80 md:mt-2 md:line-clamp-3 md:text-sm md:leading-6">
            {item.anime.synopsis}
          </p>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-white/80 md:mt-3 md:gap-2 md:text-xs">
          <span className="rounded-md bg-indigo-500/20 px-2.5 py-0.5 text-indigo-100">
            {STATUS_BADGES[item.status] ?? item.status}
          </span>
          <span className="rounded-md bg-white/10 px-2.5 py-0.5 text-white/80">
            {item.anime.releaseYear}
          </span>
          <span className="rounded-md bg-white/10 px-2.5 py-0.5 text-white/80">
            Rating: {formatRating(item.anime.avgRating)}
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-2 md:mt-4 md:flex-row md:flex-wrap md:items-center md:justify-between">
          <select
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white shadow-sm transition focus:border-indigo-400 focus:outline-none disabled:opacity-60"
            value={item.status}
            onChange={(e) => onStatusChange(e.target.value)}
            disabled={mutating}
          >
            {WATCH_STATUSES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 md:justify-end">
            <button
              type="button"
              onClick={onRemove}
              disabled={mutating}
              className="rounded-lg border border-red-300/50 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100 transition hover:bg-red-500/20 disabled:opacity-60"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21s-6.5-4.35-9.11-8.61C-0.2 8.28 2.12 3 6.35 3A5.4 5.4 0 0 1 12 6.4 5.4 5.4 0 0 1 17.65 3c4.23 0 6.55 5.28 3.46 9.39C18.5 16.65 12 21 12 21Z" />
    </svg>
  );
}

