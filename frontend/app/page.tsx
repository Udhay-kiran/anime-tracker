"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Anime = {
  _id?: string;
  title: string;
  slug: string;
  releaseYear?: number;
  status?: string;
  avgRating?: number | null;
};

type Highlights = {
  topRated: Anime[];
  recent2025: Anime[];
  trending: Anime[];
  comingSoon: Anime[];
};

type LoadState = "loading" | "error" | "ready";

const features = [
  {
    title: "Watchlist you control",
    description: "Plan what to watch next, keep up weekly, and celebrate when you finish a series.",
    icon: "WL",
  },
  {
    title: "Smooth browsing",
    description: "Find new shows fast with clean navigation that keeps spoilers out of sight.",
    icon: "API",
  },
  {
    title: "Smart filters",
    description: "Sort by vibe, year, or favorites so you always land on the right pick.",
    icon: "FX",
  },
  {
    title: "Personalized view",
    description: "See ratings, status, and progress together without digging through menus.",
    icon: "STAT",
  },
  {
    title: "Private by default",
    description: "Your profile and list stay yours with simple controls to update anytime.",
    icon: "SEC",
  },
  {
    title: "Quick links",
    description: "Jump straight into any series page and keep the momentum going.",
    icon: "GO",
  },
];

const formatRating = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "N/A";
  }

  return value.toFixed(1);
};

const STATUS_LABELS: Record<string, string> = {
  coming_soon: "Coming soon",
  airing: "Airing",
  finished: "Finished",
  hiatus: "Hiatus",
};

const formatStatus = (status?: string) =>
  status ? STATUS_LABELS[status] ?? status : "Status TBD";

export default function HomePage() {
  const [highlights, setHighlights] = useState<Highlights>({
    topRated: [],
    recent2025: [],
    trending: [],
    comingSoon: [],
  });
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);

  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadHighlights = async () => {
      try {
        setState("loading");
        setError(null);
        const res = await fetch("http://localhost:4000/api/anime/highlights", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        const data: Highlights = await res.json();
        setHighlights({
          topRated: data.topRated || [],
          recent2025: data.recent2025 || [],
          trending: data.trending || [],
          comingSoon: data.comingSoon || [],
        });
        setState("ready");
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError((err as Error).message || "Failed to load highlights.");
        setState("error");
      }
    };

    loadHighlights();
    return () => controller.abort();
  }, []);

  // Smooth-scroll to #contact (the REAL contact form section)
  useEffect(() => {
    const scrollToHash = () => {
      if (typeof window === "undefined") return;
      if (window.location.hash === "#contact") {
        const el = document.getElementById("contact");
        if (el) {
          const scrollNow = () =>
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          requestAnimationFrame(scrollNow);
          window.setTimeout(scrollNow, 200);
        }
      }
    };

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formValues.name.trim()) errors.name = "Name is required";
    if (!formValues.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email.trim())) {
      errors.email = "Enter a valid email";
    }
    if (!formValues.message.trim()) errors.message = "Message is required";
    return errors;
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    setFormSuccess("Thanks for reaching out! We'll respond shortly.");
    setFormValues({ name: "", email: "", message: "" });
    setTimeout(() => setFormSuccess(null), 4000);
  };

  const highlightContent = useMemo(() => {
    if (state === "loading") {
      return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-zinc-200 bg-white/70 p-4 shadow-sm"
            >
              <div className="mb-4 h-5 w-32 animate-pulse rounded bg-zinc-200" />
              <div className="space-y-2">
                {[...Array(6)].map((__, cardIdx) => (
                  <div
                    key={cardIdx}
                    className="h-14 animate-pulse rounded-xl bg-zinc-200"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (state === "error") {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error || "Unable to load highlights right now."}
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <HighlightColumn title="Top rated of all time" items={highlights.topRated} />
        <HighlightColumn title="Recent (2025) releases" items={highlights.recent2025} />
        <HighlightColumn
          title="Trending now"
          items={highlights.trending}
          badge="Most watchlisted"
        />
        <HighlightColumn title="Coming soon" items={highlights.comingSoon} />
      </div>
    );
  }, [error, highlights, state]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-indigo-50 text-zinc-900">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <section className="grid items-center gap-10 md:grid-cols-2">
          <div className="space-y-6">
            <div className="inline-flex rounded-full bg-indigo-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">
              Welcome to Anilog
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
                Track everything you watch. Discover what comes next.
              </h1>
              <p className="text-base text-zinc-600 md:text-lg">
                Anilog keeps your anime life organized with easy browsing, quick saves, and
                a watchlist that stays in sync. Discover new releases, revisit favorites,
                and see what to watch next.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/browse"
                className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-700"
              >
                Browse
              </Link>
              <Link
                href="/watchlist"
                className="rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-400 hover:text-indigo-700"
              >
                My List
              </Link>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-zinc-600">
              <span className="rounded-full bg-white/80 px-3 py-1 font-semibold shadow-sm">
                Built for anime fans
              </span>
              <span className="rounded-full bg-white/80 px-3 py-1 font-semibold shadow-sm">
                Always up to date
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                  Quick look
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-zinc-900">
                  Ready for your next watch
                </h2>
              </div>
              <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                Start exploring
              </span>
            </div>
            <div className="mt-6 space-y-4 text-sm">
              <StatBlock label="Your hub" value="Browse, track, and revisit favorites" />
              <StatBlock label="Fresh picks" value="Top-rated, trending, and new releases" />
              <StatBlock label="Watchlist" value="Planned / Watching / Completed" />
              <StatBlock label="Details" value="Deep dives for every series you open" />
            </div>
          </div>
        </section>

        {/* FEATURES SECTION (not contact) */}
        <section className="mt-14 scroll-mt-28 md:scroll-mt-32" id="features">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                Features
              </p>
              <h2 className="text-2xl font-semibold md:text-3xl">Why Anilog</h2>
            </div>
            <Link
              href="/browse"
              className="text-sm font-semibold text-indigo-700 transition hover:text-indigo-800"
            >
              Start browsing
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-zinc-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-700">
                    {feature.icon}
                  </span>
                  <h3 className="text-lg font-semibold text-zinc-900">{feature.title}</h3>
                </div>
                <p className="mt-3 text-sm text-zinc-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                Highlights
              </p>
              <h2 className="text-2xl font-semibold md:text-3xl">What&apos;s hot on Anilog</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Automatically refreshed with top picks and new releases.
              </p>
            </div>
            <div className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-zinc-700 shadow-sm">
              Always current
            </div>
          </div>
          {highlightContent}
        </section>

        {/* REAL CONTACT SECTION (this is what #contact should point to) */}
        <section className="mt-14 scroll-mt-28 md:scroll-mt-32" id="contact">
          <div className="rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-lg backdrop-blur">
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                  Contact us
                </p>
                <h2 className="text-2xl font-semibold md:text-3xl">
                  Let&apos;s build your anime hub
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Send a quick note and we&apos;ll get back to you (no emails sent yet).
                </p>
              </div>
              {formSuccess && (
                <div className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 shadow-sm">
                  {formSuccess}
                </div>
              )}
            </div>

            <form
              onSubmit={handleContactSubmit}
              className="grid gap-4 md:grid-cols-2"
              suppressHydrationWarning
            >
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-800">Name</label>
                <input
                  type="text"
                  value={formValues.name}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="Your name"
                />
                {formErrors.name && (
                  <p className="text-xs font-semibold text-red-600">{formErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-800">Email</label>
                <input
                  type="email"
                  value={formValues.email}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="you@example.com"
                />
                {formErrors.email && (
                  <p className="text-xs font-semibold text-red-600">{formErrors.email}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-zinc-800">Message</label>
                <textarea
                  value={formValues.message}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, message: e.target.value }))
                  }
                  className="min-h-[120px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="Tell us what you want to see in Anilog"
                />
                {formErrors.message && (
                  <p className="text-xs font-semibold text-red-600">{formErrors.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-700"
                >
                  Send message
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

function HighlightColumn({
  title,
  items,
  badge,
}: {
  title: string;
  items: Anime[];
  badge?: string;
}) {
  return (
    <div className="h-full rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
          <p className="text-xs text-zinc-600">Top 6 picks</p>
        </div>
        {badge && (
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-4 space-y-2">
        {items.length ? (
          items.map((anime) => (
            <Link
              href={`/anime/${anime.slug}`}
              key={anime._id ?? anime.slug}
              className="block rounded-xl border border-zinc-100 bg-white/90 p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900">
                    {anime.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-600">
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-semibold text-zinc-800">
                      {anime.releaseYear ?? "TBD"}
                    </span>
                    <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700">
                      {formatStatus(anime.status)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-[11px] font-semibold text-zinc-800">
                  <span>*</span>
                  <span>{formatRating(anime.avgRating)}</span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-white/70 p-4 text-center text-sm text-zinc-600">
            No titles yet.
          </div>
        )}
      </div>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-zinc-100/60 px-4 py-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <span className="text-sm font-semibold text-zinc-900">{value}</span>
    </div>
  );
}
