"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
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
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "N/A";
  }

  return value.toFixed(1);
};

const fallback = (value?: string | number | null) =>
  value === null || value === undefined || value === "" ? "N/A" : value;

export default function AnimePage() {
  const [anime, setAnime] = useState<Anime | null>(null);
  const [session, setSession] = useState<{ id: string; username: string } | null>(null);
  const [status, setStatus] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [watchStatus, setWatchStatus] = useState<string | null>(null);
  const [watchState, setWatchState] = useState<WatchlistState>("idle");
  const [watchError, setWatchError] = useState<string | null>(null);
  const router = useRouter();

  const [reviews, setReviews] = useState<
    { _id: string; userId: string; username: string; rating?: number | null; text: string; createdAt: string }[]
  >([]);
  const [reviewsState, setReviewsState] = useState<ReviewsState>("idle");
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState<string>("");
  const [savingReview, setSavingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const selectedRating = reviewRating === "" ? null : Number.isNaN(Number(reviewRating)) ? null : Number(reviewRating);

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
      const data: {
        _id: string;
        userId: string;
        username: string;
        rating?: number | null;
        text: string;
        createdAt: string;
      }[] = await res.json();
      setReviews(data);
      setReviewsState("ready");
    } catch (err) {
      setReviewsError((err as Error).message || "Failed to load reviews");
      setReviewsState("error");
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
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

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data: Anime = await response.json();
        setAnime(data);
        setStatus("ready");
        if (data?._id) {
          fetchReviews(data._id);
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError((err as Error).message || "Failed to load anime.");
        setStatus("error");
      }
    };

    load();
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
        body: JSON.stringify(
          inWatchlist ? { status: nextStatus } : { animeId: anime._id, status: nextStatus }
        ),
      });

      if (res.status === 401) {
        throw new Error("Please log in to manage your list");
      }

      if (!res.ok) {
        const message = `Failed to save (status ${res.status})`;
        throw new Error(message);
      }

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
      if (!res.ok && res.status !== 404) {
        throw new Error(`Failed to remove (status ${res.status})`);
      }
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
      if (!res.ok) {
        const msg = `Failed to save review (${res.status})`;
        throw new Error(msg);
      }
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

  if (status === "loading" || status === "idle") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-indigo-50 text-zinc-900">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="flex flex-col gap-3">
            <div className="h-4 w-24 animate-pulse rounded bg-zinc-200" />
            <div className="h-8 w-2/3 animate-pulse rounded bg-zinc-200" />
            <div className="h-20 w-full animate-pulse rounded bg-zinc-200" />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {[...Array(6)].map((_, idx) => (
                <div key={idx} className="h-16 animate-pulse rounded-lg bg-zinc-200" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900">
        <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 text-center">
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
        <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 text-center">
          <div className="rounded-full bg-red-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-700">
            Not found
          </div>
          <h1 className="mt-4 text-3xl font-semibold">Anime not found</h1>
          <p className="mt-2 text-sm text-zinc-600">
            We couldn&apos;t find an anime with the slug "{slug}".
          </p>
        </div>
      </div>
    );
  }

  const userReview = session ? reviews.find((r) => r.userId === session.id) || null : null;

  if (!anime) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-indigo-50 text-zinc-900">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="relative h-[360px] w-full overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-100 via-white to-zinc-200 shadow-sm md:h-[460px] md:w-[320px] md:min-w-[300px] md:max-w-[340px]">
            {anime.posterUrl ? (
              <Image
                src={anime.posterUrl}
                alt={anime.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 320px, 360px"
                priority
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-center text-sm font-semibold text-zinc-500">
                <span className="rounded-full bg-white/80 px-4 py-2 text-xs uppercase tracking-wide text-zinc-400 shadow-sm">
                  No poster yet
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                Anime detail
              </p>
              <h1 className="mt-2 text-3xl font-semibold md:text-4xl">{anime.title}</h1>
              <p className="mt-3 text-sm text-zinc-600 md:text-base">{anime.synopsis}</p>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-zinc-700">Watch status</span>
              <div className="flex flex-wrap gap-3">
                {WATCH_STATUSES.map((option) => {
                  const isActive = watchStatus === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => upsertWatchlist(option.value)}
                      disabled={watchState === "loading"}
                      className={`rounded-lg border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 ${
                        isActive
                          ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                          : "border-zinc-200 bg-white text-zinc-800 hover:border-indigo-300 hover:text-indigo-700"
                      }`}
                    >
                      {isActive ? `Marked as ${option.label}` : option.label}
                    </button>
                  );
                })}
                {watchStatus && (
                  <button
                    onClick={removeFromWatchlist}
                    disabled={watchState === "loading"}
                    className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 disabled:opacity-60"
                  >
                    Remove from My List
                  </button>
                )}
              </div>
              {watchState === "error" && watchError && (
                <span className="text-sm text-red-600">{watchError}</span>
              )}
            </div>

            <div className="grid gap-4 rounded-xl border border-zinc-200 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
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
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-4 rounded-xl border border-zinc-200 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
              Synopsis
            </p>
            <p className="mt-2 text-sm text-zinc-700 md:text-base">{anime.synopsis || "No synopsis available."}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
              Description
            </p>
            <p className="mt-2 text-sm text-zinc-700 md:text-base">
              {anime.description?.trim()
                ? anime.description
                : "Detailed description coming soon."}
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-zinc-200 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                Reviews
              </p>
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
                  <RatingPicker
                    value={selectedRating}
                    onChange={(val) => setReviewRating(val === null ? "" : String(val))}
                  />
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
                <span className="font-semibold text-zinc-900">
                  Login/Register to leave a review
                </span>
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
                  <article
                    key={review._id}
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">{review.username}</p>
                        <p className="text-xs text-zinc-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {review.rating ? (
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                          Rating: {review.rating}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">
                      {review.text}
                    </p>
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
      </div>
    </div>
  );
}

function RatingPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (val: number | null) => void;
}) {
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
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <span className="text-base font-semibold text-zinc-900">{value}</span>
    </div>
  );
}
