"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type Props = {
  title: string;
  slug?: string;
  releaseYear?: number;
  status?: string;
  avgRating?: number | null;
  posterUrl?: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  coming_soon: "Coming soon",
  airing: "Airing",
  finished: "Finished",
  hiatus: "Hiatus",
  NOT_YET_RELEASED: "Not yet released",
};

const formatStatus = (status?: string) =>
  status ? STATUS_LABELS[status] ?? status : "Status TBD";

const formatRating = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "N/A";
  }
  return value.toFixed(1);
};

export default function HighlightAnimeCard({
  title,
  slug,
  releaseYear,
  status,
  avgRating,
  posterUrl,
}: Props) {
  const [fallback, setFallback] = useState(false);
  const poster = fallback ? "/posters/fallback.jpg" : posterUrl || "/posters/fallback.jpg";
  const content = (
    <div className="flex h-full min-h-[150px] rounded-xl border border-white/10 bg-black/25 p-3 shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:ring-1 hover:ring-indigo-400/20 hover:shadow-2xl">
      <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5 md:h-28 md:w-20">
        <Image
          src={poster}
          alt={`${title} poster`}
          fill
          sizes="96px"
          className="object-cover"
          onError={() => setFallback(true)}
        />
      </div>
      <div className="ml-3 flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <p className="truncate text-sm font-semibold text-white">{title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-white/70">
            <span className="rounded-md bg-white/5 px-2 py-0.5 font-semibold text-white/80 ring-1 ring-white/10">
              {releaseYear ?? "TBD"}
            </span>
            <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 font-semibold text-indigo-200 ring-1 ring-indigo-400/15">
              {formatStatus(status)}
            </span>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1 self-start rounded-full bg-white/5 px-2 py-1 text-[11px] font-semibold text-white/85 ring-1 ring-white/10">
          <span>*</span>
          <span>{formatRating(avgRating)}</span>
        </div>
      </div>
    </div>
  );

  return slug ? (
    <Link href={`/anime/${slug}`} className="block h-full">
      {content}
    </Link>
  ) : (
    content
  );
}
