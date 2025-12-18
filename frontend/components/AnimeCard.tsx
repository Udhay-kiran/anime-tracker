"use client";

import Link from "next/link";
import { MouseEvent } from "react";

export type AnimeCardAnime = {
  _id?: string;
  title: string;
  slug: string;
  synopsis?: string;
  releaseYear?: number;
  status?: string;
  avgRating?: number | null;
  genres?: string[];
  posterUrl?: string;
};

type Props = {
  anime: AnimeCardAnime;
  isWatchlisted: boolean;
  watchlistLoading?: boolean;
  isFavorite: boolean;
  onToggleWatchlist: (animeId: string) => void | Promise<void>;
  onToggleFavorite: (animeId: string) => void | Promise<void>;
  showFavorite?: boolean;
  statusLabel?: string;
};

const STATUS_LABELS: Record<string, string> = {
  coming_soon: "Coming soon",
  airing: "Airing",
  finished: "Finished",
  hiatus: "Hiatus",
};

const formatRating = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "N/A";
  }
  return value.toFixed(1);
};

const formatStatus = (status?: string) => (status ? STATUS_LABELS[status] ?? status : "Status TBD");

export default function AnimeCard({
  anime,
  isWatchlisted,
  watchlistLoading,
  isFavorite,
  onToggleWatchlist,
  onToggleFavorite,
  showFavorite = true,
  statusLabel,
}: Props) {
  const animeId = anime._id ?? anime.slug;

  const handleWatchlist = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!animeId) return;
    onToggleWatchlist(animeId);
  };

  const handleFavorite = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!animeId) return;
    onToggleFavorite(animeId);
  };

  return (
    <Link
      href={`/anime/${anime.slug}`}
      className="group relative block h-full rounded-xl border border-zinc-200 bg-white/90 p-5 pb-16 shadow-sm backdrop-blur-sm transition duration-200 ease-out hover:-translate-y-1.5 hover:scale-[1.03] hover:shadow-2xl hover:ring-1 hover:ring-indigo-100"
    >
      {statusLabel ? (
        <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-indigo-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
          {statusLabel.toUpperCase()}
        </div>
      ) : null}
      <div className="mb-4 aspect-[3/4] w-full overflow-hidden rounded-lg border border-zinc-200 bg-gradient-to-br from-zinc-100 via-white to-zinc-200">
        {anime.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={anime.posterUrl}
            alt={anime.title}
            className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Poster coming soon
          </div>
        )}
      </div>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900 group-hover:text-indigo-600">
          {anime.title}
        </h2>
      </div>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-700">
        {anime.synopsis}
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-600">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-md bg-zinc-100 px-2 py-1 font-medium text-zinc-800">
            {anime.releaseYear ?? "TBD"}
          </span>
          <span className="rounded-md bg-zinc-100 px-2 py-1 font-medium text-zinc-800">
            Rating: {formatRating(anime.avgRating)}
          </span>
          <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">
            {formatStatus(anime.status)}
          </span>
          {anime.genres?.slice(0, 2).map((g) => (
            <span
              key={g}
              className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700"
            >
              {g}
            </span>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3">
        {showFavorite ? (
          <div className="flex justify-end">
            <div
              className={`flex gap-2 transition ${
                isFavorite
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
              }`}
            >
              <button
                type="button"
                onClick={handleFavorite}
                aria-label={isFavorite ? "Remove heart" : "Add heart"}
                className={`pointer-events-auto flex items-center justify-center rounded-full border px-4 py-2 text-rose-600 shadow-sm transition ${
                  isFavorite
                    ? "border-rose-200 bg-rose-50"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-rose-300 hover:text-rose-700"
                }`}
              >
                <HeartIcon filled={isFavorite} />
              </button>
            </div>
          </div>
        ) : (
          <div />
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleWatchlist}
            disabled={watchlistLoading}
            className={`pointer-events-auto w-full rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition md:w-auto ${
              isWatchlisted
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "bg-white text-zinc-800 hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-700 md:border md:border-zinc-200"
            } ${watchlistLoading ? "opacity-70" : ""} opacity-100 md:opacity-0 md:pointer-events-auto md:group-hover:opacity-100 md:group-hover:pointer-events-auto`}
          >
            {isWatchlisted ? "In Watchlist" : "Add to Watchlist"}
          </button>
        </div>
      </div>
    </Link>
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
