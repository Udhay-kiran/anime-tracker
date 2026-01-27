"use client";

import Link from "next/link";
import { ChangeEvent, MouseEvent } from "react";

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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
  );
}

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

type Mode = "browse" | "mylist";
type StatusOption = { value: string; label: string };

type Props = {
  anime: AnimeCardAnime;
  isWatchlisted: boolean;
  watchlistLoading?: boolean;
  isFavorite: boolean;
  onToggleWatchlist: (animeId: string) => void | Promise<void>;
  onToggleFavorite: (animeId: string) => void | Promise<void>;
  showFavorite?: boolean;
  statusLabel?: string;
  mode?: Mode;
  primaryActionLabel?: string;
  primaryActionDisabled?: boolean;
  showStatusDropdown?: boolean;
  statusOptions?: StatusOption[];
  statusValue?: string;
  onStatusChange?: (value: string) => void;
  showRemoveButton?: boolean;
  removeLabel?: string;
  onRemove?: () => void;
  actionsDisabled?: boolean;
};

const STATUS_LABELS: Record<string, string> = {
  coming_soon: "Coming soon",
  airing: "Airing",
  finished: "Finished",
  hiatus: "Hiatus",
};

const formatRating = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "N/A";
  return value.toFixed(1);
};

const formatStatus = (status?: string) => (status ? STATUS_LABELS[status] ?? status : "Status TBD");

const GLASS_CARD =
  "rounded-2xl border border-white/15 bg-gradient-to-br from-black/30 via-[#140d36]/50 to-[#0c0a23]/60 shadow-[0_18px_50px_rgba(0,0,0,0.45)] ring-1 ring-indigo-400/12 backdrop-blur-xl";

export default function AnimeCard({
  anime,
  isWatchlisted,
  watchlistLoading,
  isFavorite,
  onToggleWatchlist,
  onToggleFavorite,
  showFavorite = true,
  statusLabel,
  mode = "browse",
  primaryActionLabel,
  primaryActionDisabled,
  showStatusDropdown = false,
  statusOptions,
  statusValue,
  onStatusChange,
  showRemoveButton = false,
  removeLabel,
  onRemove,
  actionsDisabled = false,
}: Props) {
  const animeId = anime._id ?? anime.slug;
  const isMyList = mode === "mylist";
  const controlsDisabled = actionsDisabled || Boolean(watchlistLoading);
  const primaryLabel = primaryActionLabel ?? (isWatchlisted ? "In Watchlist" : "Add to Watchlist");
  const controlCols = showStatusDropdown && showRemoveButton ? "grid-cols-2" : "grid-cols-1";

  const handleWatchlist = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!animeId) return;
    onToggleWatchlist(animeId);
  };

  const handleFavorite = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // @ts-ignore
    e.nativeEvent?.stopImmediatePropagation?.();
    if (!animeId) return;
    onToggleFavorite(animeId);
  };

  const handleStatusSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    if (!onStatusChange) return;
    onStatusChange(e.target.value);
  };

  const handleRemove = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove?.();
  };

  const heartButton = showFavorite ? (
    <button
      type="button"
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={handleFavorite}
      aria-label={isFavorite ? "Remove heart" : "Add heart"}
      className={`pointer-events-auto absolute right-2 top-2 z-30 grid h-9 w-9 place-items-center rounded-full border text-sm shadow-sm transition ${
        isFavorite
          ? "border-rose-400/30 bg-rose-500/25 text-rose-50"
          : "border-white/20 bg-black/60 text-white/90 hover:border-rose-300/40 hover:text-rose-200"
      } backdrop-blur`}
    >
      <HeartIcon filled={isFavorite} />
    </button>
  ) : null;

  const posterAndMeta = (
    <>
      {statusLabel ? (
        <div className="absolute left-2 top-2 z-20 rounded-full bg-indigo-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm ring-1 ring-white/10">
          {statusLabel.toUpperCase()}
        </div>
      ) : null}

      <div className="flex h-full flex-col">
        <div className="h-[140px] w-full overflow-hidden rounded-xl border border-white/10 bg-white/5">
          {anime.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={anime.posterUrl} alt={anime.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[11px] font-semibold uppercase tracking-wide text-white/50">
              Poster
            </div>
          )}
        </div>

        <div className="mt-2 flex min-w-0 flex-1 flex-col">
          <h2
            className={`text-sm font-semibold leading-tight text-white ${
              isMyList ? "line-clamp-2" : "line-clamp-1"
            }`}
          >
            {anime.title}
          </h2>
          <div className="mt-1 flex h-[18px] flex-wrap gap-1 overflow-hidden text-[10px] text-white/80">
            <span className="rounded-md bg-white/10 px-2 py-0.5 ring-1 ring-white/15">
              {anime.releaseYear ?? "TBD"}
            </span>
            <span className="rounded-md bg-white/10 px-2 py-0.5 ring-1 ring-white/15">
              Rating: {formatRating(anime.avgRating)}
            </span>
            <span className="rounded-md bg-indigo-500/25 px-2 py-0.5 font-semibold text-indigo-100 ring-1 ring-indigo-300/35">
              {formatStatus(anime.status)}
            </span>
          </div>
        </div>
      </div>
    </>
  );

  const mobileCard = isMyList ? (
    <div className="group relative flex h-[250px] w-full flex-col rounded-2xl border border-white/12 bg-black/25 p-2 backdrop-blur-md shadow-sm transition md:hidden">
      {heartButton}
      <Link href={`/anime/${anime.slug}`} className="relative block h-full w-full">
        {posterAndMeta}
      </Link>
      <div className="mt-auto pt-2 pointer-events-auto">
        <div className={`grid gap-2 ${controlCols}`}>
          {showStatusDropdown ? (
            <div
              className="relative w-full"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <select
                className="min-h-[44px] w-full appearance-none rounded-xl border border-white/10 bg-black/35 px-3 py-2 pr-10 text-[11px] font-semibold text-white shadow-sm backdrop-blur-md transition focus:border-indigo-300/30 focus:outline-none focus:ring-2 focus:ring-indigo-300/30 disabled:opacity-60"
                value={statusValue}
                onChange={(e) => {
                  e.stopPropagation();
                  onStatusChange?.(e.target.value);
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                disabled={controlsDisabled}
              >
                {statusOptions?.map((option) => (
                  <option className="bg-black text-white" key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
            </div>
          ) : null}
          {showRemoveButton ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.();
              }}
              disabled={controlsDisabled}
              className="min-h-[44px] w-full rounded-xl border border-red-300/50 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100 transition hover:bg-red-500/20 disabled:opacity-60"
            >
              {removeLabel ?? "Remove"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  ) : (
    <div className="group relative flex h-[250px] w-full flex-col rounded-2xl border border-white/12 bg-black/25 p-2 backdrop-blur-md shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl md:hidden">
      {heartButton}
      <Link href={`/anime/${anime.slug}`} className="relative block h-full w-full">
        {posterAndMeta}
      </Link>
      <div className="mt-2">
        <button
          type="button"
          onClick={handleWatchlist}
          disabled={watchlistLoading || primaryActionDisabled}
          className={`h-8 w-full rounded-lg px-3 text-xs font-semibold shadow-sm transition ${
            isWatchlisted
              ? "bg-indigo-600 text-white hover:bg-indigo-700"
              : "bg-white/10 text-white/90 ring-1 ring-white/15 hover:ring-indigo-300/30"
          } ${watchlistLoading || primaryActionDisabled ? "opacity-70" : ""}`}
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  );

  const desktopCard = isMyList ? (
    <div
      className={`group relative hidden h-full ${GLASS_CARD} p-5 pb-16 transition duration-200 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-2xl hover:ring-1 hover:ring-indigo-400/25 md:block`}
    >
      {heartButton ? (
        <div className="absolute right-4 top-4 z-20">{heartButton}</div>
      ) : null}
      <Link href={`/anime/${anime.slug}`} className="block h-full w-full">
        {statusLabel ? (
          <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-indigo-500/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm ring-1 ring-white/10">
            {statusLabel.toUpperCase()}
          </div>
        ) : null}

        <div className="mb-4 aspect-[3/4] w-full overflow-hidden rounded-lg border border-white/10 bg-white/5">
          {anime.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={anime.posterUrl}
              alt={anime.title}
              className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.05]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs font-semibold uppercase tracking-wide text-white/50">
              Poster coming soon
            </div>
          )}
        </div>

        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-white group-hover:text-indigo-300">
            {anime.title}
          </h2>
        </div>

        <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/70">{anime.synopsis}</p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-white/70">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md bg-white/5 px-2 py-1 font-medium text-white/80 ring-1 ring-white/10">
              {anime.releaseYear ?? "TBD"}
            </span>
            <span className="rounded-md bg-white/5 px-2 py-1 font-medium text-white/80 ring-1 ring-white/10">
              Rating: {formatRating(anime.avgRating)}
            </span>
            <span className="rounded-md bg-indigo-500/25 px-2 py-1 text-xs font-semibold text-indigo-100 ring-1 ring-indigo-300/35">
              {formatStatus(anime.status)}
            </span>
            {anime.genres?.slice(0, 2).map((g) => (
              <span
                key={g}
                className="rounded-md bg-indigo-500/18 px-2 py-1 text-xs font-semibold text-indigo-100 ring-1 ring-indigo-300/25"
              >
                {g}
              </span>
            ))}
          </div>
        </div>
      </Link>

      <div className="mt-4 flex justify-end">
        <div className={`pointer-events-auto grid w-full gap-2 ${controlCols}`}>
          {showStatusDropdown ? (
            <div
              className="relative w-full"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <select
                className="min-h-[44px] w-full appearance-none rounded-xl border border-white/10 bg-black/35 px-3 py-2 pr-10 text-sm font-semibold text-white shadow-sm backdrop-blur-md transition focus:border-indigo-300/30 focus:outline-none focus:ring-2 focus:ring-indigo-300/30 disabled:opacity-60"
                value={statusValue}
                onChange={(e) => {
                  e.stopPropagation();
                  onStatusChange?.(e.target.value);
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                disabled={controlsDisabled}
              >
                {statusOptions?.map((option) => (
                  <option className="bg-black text-white" key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
            </div>
          ) : null}
          {showRemoveButton ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.();
              }}
              disabled={controlsDisabled}
              className="min-h-[44px] w-full rounded-xl border border-red-300/50 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/20 disabled:opacity-60"
            >
              {removeLabel ?? "Remove"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  ) : (
    <div
      className={`group relative hidden h-full ${GLASS_CARD} p-5 pb-16 transition duration-200 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-2xl hover:ring-1 hover:ring-indigo-400/25 md:block`}
    >
      {heartButton ? (
        <div className="absolute right-4 top-4 z-20">{heartButton}</div>
      ) : null}
      <Link href={`/anime/${anime.slug}`} className="block h-full w-full">
      {statusLabel ? (
        <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-indigo-500/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm ring-1 ring-white/10">
          {statusLabel.toUpperCase()}
        </div>
      ) : null}

      <div className="mb-4 aspect-[3/4] w-full overflow-hidden rounded-lg border border-white/10 bg-white/5">
        {anime.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={anime.posterUrl}
            alt={anime.title}
            className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs font-semibold uppercase tracking-wide text-white/50">
            Poster coming soon
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-white group-hover:text-indigo-300">{anime.title}</h2>
      </div>

      <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/70">{anime.synopsis}</p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-white/70">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-md bg-white/5 px-2 py-1 font-medium text-white/80 ring-1 ring-white/10">
            {anime.releaseYear ?? "TBD"}
          </span>
          <span className="rounded-md bg-white/5 px-2 py-1 font-medium text-white/80 ring-1 ring-white/10">
            Rating: {formatRating(anime.avgRating)}
          </span>
          <span className="rounded-md bg-indigo-500/25 px-2 py-1 text-xs font-semibold text-indigo-100 ring-1 ring-indigo-300/35">
            {formatStatus(anime.status)}
          </span>
          {anime.genres?.slice(0, 2).map((g) => (
            <span
              key={g}
              className="rounded-md bg-indigo-500/18 px-2 py-1 text-xs font-semibold text-indigo-100 ring-1 ring-indigo-300/25"
            >
              {g}
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleWatchlist}
          disabled={watchlistLoading || primaryActionDisabled}
          className={`pointer-events-auto w-full rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition md:w-auto ${
            isWatchlisted
              ? "bg-indigo-600 text-white hover:bg-indigo-700"
              : "bg-black/30 text-white/85 ring-1 ring-white/10 hover:-translate-y-0.5 hover:ring-indigo-400/30 hover:text-white"
          } ${watchlistLoading || primaryActionDisabled ? "opacity-70" : ""} opacity-100 md:opacity-0 md:pointer-events-auto md:group-hover:opacity-100 md:group-hover:pointer-events-auto backdrop-blur-md`}
        >
          {primaryLabel}
        </button>
      </div>
      </Link>
    </div>
  );

  const actionNode = (
    <>
      {mobileCard}
      {desktopCard}
    </>
  );

  return actionNode;
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
