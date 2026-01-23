"use client";

import Image from "next/image";
import { useMemo } from "react";

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

export default function HighlightAnimeCard({ title, slug, releaseYear, status, avgRating, posterUrl }: Props) {
  const poster = useMemo(() => (posterUrl && posterUrl.trim() ? posterUrl : null), [posterUrl]);

  return (
    <div className="flex h-full gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2 shadow-lg backdrop-blur-md">
      <div className="relative h-[104px] w-24 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5 md:w-28">
        {poster ? (
          <Image src={poster} alt={`${title} poster`} fill sizes="140px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-white/60">
            No poster
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <p className="line-clamp-1 text-sm font-semibold text-white">{title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-white/70">
            <span className="rounded-md bg-white/5 px-2 py-0.5 font-semibold text-white/80 ring-1 ring-white/10">
              {releaseYear ?? "TBD"}
            </span>
            <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 font-semibold text-indigo-200 ring-1 ring-indigo-400/15">
              {formatStatus(status)}
            </span>
          </div>
        </div>
        <div className="mt-1 flex items-center gap-1 self-start rounded-full bg-white/5 px-2 py-1 text-[11px] font-semibold text-white/85 ring-1 ring-white/10">
          <span>*</span>
          <span>{formatRating(avgRating)}</span>
        </div>
      </div>
    </div>
  );
}
