"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Anime = {
  _id: string;
  title: string;
  slug: string;
  synopsis: string;
  releaseYear: number;
  status: string;
  genres?: string[];
  studio?: string;
  avgRating?: number | null;
  ratingsCount?: number;
  seasonsCount?: number;
  episodesCount?: number;
  posterUrl?: string;
  bannerUrl?: string;
  description?: string;
};

type LoadState = "idle" | "loading" | "error" | "not-found" | "ready";
type WatchlistState = "idle" | "loading" | "error" | "ready";
type ReviewsState = "idle" | "loading" | "error" | "ready";

const WATCH_STATUSES = [
  { value: "planned", label: "Planned" },
  { value: "watching", label: "Watching" },
  { value: "completed", label: "Completed" },
  { value: "dropped", label: "Dropped" },
];

const formatRating = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "N/A";
  return value.toFixed(1);
};

const fallback = (value?: string | number | null) =>
  value === null || value === undefined || value === "" ? "N/A" : value;

const safeUrl = (url?: string) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) return url;
  return null;
};

export default function AnimePage() {
  // ---- state (ALL hooks stay ABOVE returns) ----
  const [anime, setAnime] = useState<Anime | null>(null);
  const [session, setSession] = useState<{ id: string; username: string } | null>(null);
  const [status, setStatus] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const [watchStatus, setWatchStatus] = useState<string | null>(null);
  const [watchState, setWatchState] = useState<WatchlistState>("idle");
  const [watchError, setWatchError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<
    { _id: string; userId: string; username: string; rating?: number | null; text: string; createdAt: string }[]
  >([]);
  const [reviewsState, setReviewsState] = useState<ReviewsState>("idle");
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState<string>("");
  const [savingReview, setSavingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  // Sticky poster handoff
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [showStickyPoster, setShowStickyPoster] = useState(false);

  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();

  const selectedRating =
    reviewRating === "" ? null : Number.isNaN(Number(reviewRating)) ? null : Number(reviewRating);

  const posterFallback = "/posters/placeholder.jpg"; // optional: add this in /public/posters
  const bannerFallback = "/banners/placeholder.jpg"; // optional: add this in /public/banners

  const posterSrc = anime ? safeUrl(anime.posterUrl) ?? posterFallback : posterFallback;
  const bannerSrc = anime ? safeUrl(anime.bannerUrl) ?? safeUrl(anime.posterUrl) ?? bannerFallback : bannerFallback;

  const shortSynopsis = anime?.synopsis
    ? anime.synopsis.length > 220
      ? `${anime.synopsis.slice(0, 220).trimEnd()}…`
      : anime.synopsis
    : "";

  // ---- effects ----
  useEffect(() => {
    // hero -> sticky handoff (no janky scrollY numbers)
    const el = heroRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        // When hero is NOT visible => show sticky poster
        setShowStickyPoster(!entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const loadSession = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/auth/me", {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) {
        setSession(null);
        return;
      }
      const data = await res.json();
      setSession({ id: data.user?._id ?? data.user?.id, username: data.user?.username ?? "You" });
    } catch {
      setSession(null);
    }
  };

  const fetchReviews = async (animeId: string) => {
    setReviewsState("loading");
    setReviewsError(null);
    try {
      const res = await fetch(`http://localhost:4000/api/reviews/anime/${animeId}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setReviews(data);
      setReviewsState("ready");
    } catch (err) {
      setReviewsError((err as Error).message || "Failed to load reviews");
      setReviewsState("error");
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    const loadAnime = async () => {
      try {
        setStatus("loading");
        setError(null);

        const response = await fetch(`http://localhost:4000/api/anime/slug/${slug}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (response.status === 404) {
          setStatus("not-found");
          return;
        }

        if (!response.ok) throw new Error(`Request failed with status ${response.status}`);

        const data: Anime = await response.json();
        setAnime(data);
        setStatus("ready");
        if (data?._id) fetchReviews(data._id);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError((err as Error).message || "Failed to load anime.");
        setStatus("error");
      }
    };

    loadAnime();
    loadSession();

    return () => controller.abort();
  }, [slug]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchWatchlistEntry = async () => {
      if (status !== "ready" || !anime?._id) return;
      try {
        setWatchState("loading");
        setWatchError(null);

        const res = await fetch("http://localhost:4000/api/watchlist", {
          cache: "no-store",
          signal: controller.signal,
          credentials: "include",
        });

        if (res.status === 401) {
          setWatchStatus(null);
          setWatchState("ready");
          return;
        }
        if (!res.ok) throw new Error(`Watchlist fetch failed (${res.status})`);

        const data: { anime: Anime; status: string }[] = await res.json();
        const entry = data.find((item) => item.anime?._id === anime._id);
        setWatchStatus(entry ? entry.status : null);
        setWatchState("ready");
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setWatchError((err as Error).message || "Failed to load watchlist");
        setWatchState("error");
      }
    };

    fetchWatchlistEntry();
    return () => controller.abort();
  }, [status, anime?._id]);

  // ---- actions ----
  const upsertWatchlist = async (nextStatus: string) => {
    if (!anime) return;
    if (!session) {
      router.push("/login");
      return;
    }

    setWatchState("loading");
    setWatchError(null);

    const inWatchlist = Boolean(watchStatus);
    const method = inWatchlist ? "PATCH" : "POST";
    const url = inWatchlist
      ? `http://localhost:4000/api/watchlist/${anime._id}`
      : "http://localhost:4000/api/watchlist";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(inWatchlist ? { status: nextStatus } : { animeId: anime._id, status: nextStatus }),
      });

      if (res.status === 401) throw new Error("Please log in to manage your list");
      if (!res.ok) throw new Error(`Failed to save (status ${res.status})`);

      setWatchStatus(nextStatus);
      setWatchState("ready");
    } catch (err) {
      setWatchError((err as Error).message || "Failed to update watchlist");
      setWatchState("error");
    }
  };

  const removeFromWatchlist = async () => {
    if (!anime) return;
    if (!session) {
      router.push("/login");
      return;
    }

    setWatchState("loading");
    setWatchError(null);

    try {
      const res = await fetch(`http://localhost:4000/api/watchlist/${anime._id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.status === 401) throw new Error("Please log in to manage your list");
      if (!res.ok && res.status !== 404) throw new Error(`Failed to remove (status ${res.status})`);

      setWatchStatus(null);
      setWatchState("ready");
    } catch (err) {
      setWatchError((err as Error).message || "Failed to remove watchlist item");
      setWatchState("error");
    }
  };

  const submitReview = async () => {
    if (!anime?._id) return;
    if (!session) {
      router.push("/login");
      return;
    }

    const ratingValue = selectedRating === null ? undefined : selectedRating;
    setSavingReview(true);
    setReviewsError(null);

    try {
      const url = editingReviewId
        ? `http://localhost:4000/api/reviews/${editingReviewId}`
        : `http://localhost:4000/api/reviews/anime/${anime._id}`;
      const method = editingReviewId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: ratingValue, text: reviewText }),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error(`Failed to save review (${res.status})`);

      setReviewText("");
      setReviewRating("");
      setEditingReviewId(null);
      await fetchReviews(anime._id);
    } catch (err) {
      setReviewsError((err as Error).message || "Failed to save review");
    } finally {
      setSavingReview(false);
    }
  };

  const startEditReview = (reviewId: string) => {
    const target = reviews.find((r) => r._id === reviewId);
    if (!target) return;
    setEditingReviewId(reviewId);
    setReviewText(target.text);
    setReviewRating(target.rating ? String(target.rating) : "");
  };

  const deleteReview = async (reviewId: string) => {
    if (!session) {
      router.push("/login");
      return;
    }
    if (!anime?._id) return;

    setReviewsError(null);

    try {
      const res = await fetch(`http://localhost:4000/api/reviews/${reviewId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error(`Failed to delete (${res.status})`);

      await fetchReviews(anime._id);
      setEditingReviewId(null);
      setReviewText("");
      setReviewRating("");
    } catch (err) {
      setReviewsError((err as Error).message || "Failed to delete review");
    }
  };

  // ---- renders (safe: hooks already done) ----
  if (status === "loading" || status === "idle") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-indigo-50 text-zinc-900">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="flex flex-col gap-3">
            <div className="h-4 w-24 animate-pulse rounded bg-zinc-200" />
            <div className="h-8 w-2/3 animate-pulse rounded bg-zinc-200" />
            <div className="h-20 w-full animate-pulse rounded bg-zinc-200" />
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900">
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
          <div className="rounded-full bg-amber-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
            Error
          </div>
          <h1 className="mt-4 text-3xl font-semibold">Unable to load anime</h1>
          <p className="mt-2 text-sm text-zinc-600">{error}</p>
        </div>
      </div>
    );
  }

  if (status === "not-found") {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900">
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
          <div className="rounded-full bg-red-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-700">
            Not found
          </div>
          <h1 className="mt-4 text-3xl font-semibold">Anime not found</h1>
          <p className="mt-2 text-sm text-zinc-600">We couldn&apos;t find an anime with the slug "{slug}".</p>
        </div>
      </div>
    );
  }

  if (!anime) return null;

  const userReview = session ? reviews.find((r) => r.userId === session.id) || null : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-indigo-50 text-zinc-900">
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* HERO (only banner here; no duplicate banner below) */}
        <section
          ref={heroRef}
          className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-950 shadow-sm"
        >
          <div className="relative h-[300px] w-full md:h-[380px]">
            <Image
              src={bannerSrc}
              alt={`${anime.title} banner`}
              fill
              priority
              className="object-cover opacity-90"
              sizes="(max-width: 768px) 100vw, 1024px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-transparent to-black/10" />

            <div className="absolute inset-x-0 bottom-0 p-5 md:p-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:gap-8">
                {/* HERO POSTER (cross-fades out when sticky poster appears) */}
                <div
                  className={`relative h-[200px] w-[145px] overflow-hidden rounded-2xl border border-white/10 shadow-2xl transition-all duration-300 md:h-[240px] md:w-[175px] ${
                    showStickyPoster ? "opacity-0 translate-y-3 scale-95" : "opacity-100 translate-y-0 scale-100"
                  }`}
                >
                  <Image
                    src={posterSrc}
                    alt={anime.title}
                    fill
                    className="object-cover"
                    sizes="200px"
                    priority
                  />
                </div>

                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/85">
                    <span>Anime</span>
                    <span className="opacity-60">•</span>
                    <span>{anime.releaseYear}</span>
                    <span className="opacity-60">•</span>
                    <span className="capitalize">{anime.status}</span>
                  </div>

                  <h1 className="mt-3 text-4xl font-semibold leading-tight text-white md:text-5xl">
                    {anime.title}
                  </h1>

                  {shortSynopsis ? (
                    <p className="mt-3 max-w-2xl text-sm text-white/85 md:text-base">
                      {shortSynopsis}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {(anime.genres ?? []).slice(0, 4).map((g) => (
                      <span
                        key={g}
                        className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/10 p-5 text-white shadow-xl backdrop-blur-md md:min-w-[220px]">
                  <div className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
                    Rating
                  </div>
                  <div className="mt-2 text-4xl font-semibold">{formatRating(anime.avgRating)}</div>
                  <div className="mt-1 text-xs text-white/70">
                    {anime.ratingsCount ? `${anime.ratingsCount.toLocaleString()} ratings` : "No ratings yet"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MAIN LAYOUT: sticky poster (left) + content (right) */}
        <div className="mt-10 grid gap-8 md:grid-cols-[320px,1fr] md:items-start">
          {/* Sticky left poster (ONLY on md+) */}
          <aside className="hidden md:block">
            <div
              className={`sticky top-24 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 ${
                showStickyPoster ? "opacity-100 translate-y-0 scale-[1.06]" : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
              }`}
            >
              <div className="relative aspect-[2/3] w-full">
                <Image
                  src={posterSrc}
                  alt={`${anime.title} poster`}
                  fill
                  className="object-cover"
                  sizes="320px"
                  priority
                />
              </div>
              <div className="border-t border-zinc-200 bg-white px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  Quick actions
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {WATCH_STATUSES.map((option) => {
                    const isActive = watchStatus === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => upsertWatchlist(option.value)}
                        disabled={watchState === "loading"}
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                          isActive
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-zinc-200 bg-white text-zinc-800 hover:border-indigo-300 hover:text-indigo-700"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>

                {watchStatus ? (
                  <button
                    onClick={removeFromWatchlist}
                    disabled={watchState === "loading"}
                    className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-100 disabled:opacity-60"
                  >
                    Remove from My List
                  </button>
                ) : null}

                {watchState === "error" && watchError ? (
                  <p className="mt-2 text-xs text-red-600">{watchError}</p>
                ) : null}
              </div>
            </div>
          </aside>

          {/* Right content */}
          <main className="space-y-8">
            {/* Watch status (mobile) */}
            <section className="rounded-2xl border border-zinc-200 bg-white/90 p-6 shadow-sm backdrop-blur-sm md:hidden">
              <div className="text-sm font-medium text-zinc-700">Watch status</div>
              <div className="mt-3 flex flex-wrap gap-3">
                {WATCH_STATUSES.map((option) => {
                  const isActive = watchStatus === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => upsertWatchlist(option.value)}
                      disabled={watchState === "loading"}
                      className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                        isActive
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-zinc-200 bg-white text-zinc-800 hover:border-indigo-300 hover:text-indigo-700"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {watchStatus ? (
                <button
                  onClick={removeFromWatchlist}
                  disabled={watchState === "loading"}
                  className="mt-3 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 disabled:opacity-60"
                >
                  Remove from My List
                </button>
              ) : null}

              {watchState === "error" && watchError ? (
                <p className="mt-2 text-sm text-red-600">{watchError}</p>
              ) : null}
            </section>

            {/* Stats */}
            <section className="grid gap-4 rounded-2xl border border-zinc-200 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
              <div className="grid grid-cols-1 gap-4 text-sm text-zinc-700 sm:grid-cols-2 lg:grid-cols-3">
                <Stat label="Release Year" value={anime.releaseYear} />
                <Stat label="Status" value={anime.status} />
                <Stat label="Average Rating" value={formatRating(anime.avgRating)} />
                <Stat label="Seasons" value={fallback(anime.seasonsCount)} />
                <Stat label="Episodes" value={fallback(anime.episodesCount)} />
                <Stat label="Studio" value={fallback(anime.studio)} />
              </div>
              <div className="text-sm text-zinc-700">
                <span className="font-semibold text-zinc-900">Genres: </span>
                {anime.genres?.length ? anime.genres.join(", ") : "N/A"}
              </div>
            </section>

            {/* Synopsis + Description */}
            <section className="grid gap-4 rounded-2xl border border-zinc-200 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Synopsis</p>
                <p className="mt-2 text-sm text-zinc-700 md:text-base">
                  {anime.synopsis || "No synopsis available."}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Description</p>
                <p className="mt-2 text-sm text-zinc-700 md:text-base">
                  {anime.description?.trim() ? anime.description : "Detailed description coming soon."}
                </p>
              </div>
            </section>

            {/* Reviews */}
            <section className="rounded-2xl border border-zinc-200 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Reviews</p>
                  <h2 className="text-xl font-semibold text-zinc-900">What fans are saying</h2>
                </div>
              </div>

              <div className="mt-4">
                {session ? (
                  <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50/80 p-4">
                    {userReview && (
                      <div className="flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700">
                        <span>You already reviewed this anime.</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditReview(userReview._id)}
                            className="rounded-md border border-indigo-200 px-3 py-1 text-indigo-700 transition hover:bg-indigo-100"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteReview(userReview._id)}
                            className="rounded-md border border-red-200 px-3 py-1 text-red-600 transition hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}

                    <label className="text-sm font-semibold text-zinc-800">
                      Your review
                      <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none"
                        placeholder="Share your thoughts (5-2000 characters)"
                      />
                    </label>

                    <div className="flex flex-wrap items-center gap-3">
                      <RatingPicker value={selectedRating} onChange={(val) => setReviewRating(val === null ? "" : String(val))} />
                      <button
                        onClick={submitReview}
                        disabled={savingReview}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
                      >
                        {editingReviewId ? "Update review" : "Post review"}
                      </button>

                      {editingReviewId && (
                        <button
                          onClick={() => {
                            setEditingReviewId(null);
                            setReviewText("");
                            setReviewRating("");
                          }}
                          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
                        >
                          Cancel edit
                        </button>
                      )}

                      {reviewsError && <span className="text-sm text-red-600">{reviewsError}</span>}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-sm text-zinc-700">
                    <span className="font-semibold text-zinc-900">Login/Register to leave a review</span>
                    <button
                      onClick={() => router.push("/login")}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-indigo-700"
                    >
                      Go to login
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6">
                {reviewsState === "loading" ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, idx) => (
                      <div key={idx} className="h-20 rounded-lg bg-zinc-100 animate-pulse" />
                    ))}
                  </div>
                ) : reviewsState === "error" ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {reviewsError || "Failed to load reviews"}
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                    Be the first one to leave a review.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <article key={review._id} className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-zinc-900">{review.username}</p>
                            <p className="text-xs text-zinc-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                          </div>
                          {review.rating ? (
                            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                              Rating: {review.rating}
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">{review.text}</p>

                        {session?.id === review.userId && (
                          <div className="mt-3 flex gap-2 text-xs font-semibold">
                            <button
                              onClick={() => startEditReview(review._id)}
                              className="rounded-lg border border-zinc-200 px-3 py-1 text-zinc-800 transition hover:bg-zinc-100"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteReview(review._id)}
                              className="rounded-lg border border-red-200 px-3 py-1 text-red-600 transition hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

function RatingPicker({ value, onChange }: { value: number | null; onChange: (val: number | null) => void }) {
  const options = Array.from({ length: 10 }, (_, idx) => idx + 1);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-zinc-800">Rating (optional)</span>
        <span className="text-xs font-medium text-zinc-500">
          {value === null ? "No rating selected" : `${value}/10 selected`}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {options.map((option) => {
          const isActive = value === option;
          return (
            <button
              key={option}
              type="button"
              aria-label={`Rate ${option} out of 10`}
              aria-pressed={isActive}
              onClick={() => onChange(option)}
              className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 ${
                isActive
                  ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-300 hover:text-indigo-700"
              }`}
            >
              {option}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ml-1 rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-zinc-100/60 px-3 py-2">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</span>
      <span className="text-base font-semibold text-zinc-900">{value}</span>
    </div>
  );
}
