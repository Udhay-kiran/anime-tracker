"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AnimeCard, { AnimeCardAnime } from "@/components/AnimeCard";
import { apiFetch, apiUrl } from "@/lib/api";
import Link from "next/link";

export type TabKey = "favorites" | "planned" | "watching" | "completed" | "dropped";

type Anime = AnimeCardAnime & {
  _id: string;
  synopsis: string;
  localPoster?: string;
};

type WatchlistItem = {
  _id: string;
  status: string;
  favorite: boolean;
  anime: Anime;
};

type Props = { initialTab: TabKey };

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

export default function WatchlistClient({ initialTab }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [visibleCount, setVisibleCount] = useState(CARDS_PER_BATCH);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch(apiUrl("/api/watchlist"), {
        cache: "no-store",
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

  useEffect(() => {
    router.replace(`/watchlist?tab=${activeTab}`, { scroll: false });
  }, [activeTab, router]);

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
        item.anime._id === animeId ? { ...item, status } : item
      )
    );
    try {
      const res = await apiFetch(apiUrl(`/api/watchlist/${animeId}/status`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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
      const res = await apiFetch(apiUrl(`/api/watchlist/${animeId}`), {
        method: "DELETE",
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
    const nextFavorite = !currentFavorite;
    const prevItems = items;
    setMutatingId(animeId);
    setError(null);
    setItems((prev) =>
      prev.map((item) =>
        item.anime._id === animeId ? { ...item, favorite: nextFavorite } : item
      )
    );
    try {
      const res = await apiFetch(apiUrl(`/api/watchlist/${animeId}/favorite`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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
      setItems(prevItems);
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
        <div className="mx-auto max-w-6xl px-6 py-12 pb-24">
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
                      isActive ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-700"
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
                    <AnimeCard
                      key={item._id}
                      mode="mylist"
                      anime={{
                        ...item.anime,
                        posterUrl: item.anime.localPoster ?? item.anime.posterUrl,
                      }}
                      isWatchlisted
                      watchlistLoading={mutatingId === item.anime._id}
                      isFavorite={item.favorite}
                      showFavorite
                      statusLabel={STATUS_BADGES[item.status] ?? item.status}
                      primaryActionLabel="In Watchlist"
                      primaryActionDisabled
                      showStatusDropdown
                      statusOptions={WATCH_STATUSES}
                      statusValue={item.status}
                      onStatusChange={(status) => updateStatus(item.anime._id, status)}
                      showRemoveButton
                      removeLabel="Remove"
                      onRemove={() => removeItem(item.anime._id)}
                      actionsDisabled={mutatingId === item.anime._id}
                      onToggleWatchlist={() => {}}
                      onToggleFavorite={() => toggleFavorite(item.anime._id, item.favorite)}
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
