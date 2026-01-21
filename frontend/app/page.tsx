"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import HighlightAnimeCard from "./components/HighlightAnimeCard";
import useInView from "./components/useInView";

type Anime = {
  _id?: string;
  title: string;
  slug?: string;
  releaseYear?: number;
  status?: string;
  avgRating?: number | null;
  averageScore?: number | null;
  posterUrl?: string | null;
  localPoster?: string | null;
};

type Highlights = {
  topRated: Anime[];
  recent2025: Anime[];
  trending: Anime[];
  comingSoon: Anime[];
};

type ExternalHighlight = {
  source: string;
  externalId: string;
  title: string;
  releaseYear: number | null;
  status: string | null;
  avgRating: number | null;
  posterUrl?: string | null;
};

type LoadState = "loading" | "error" | "ready";

type HeroPoster = {
  base: string;
  className: string;
};

type QuickLookItem = {
  title: string;
  description: string;
  icon: "pin" | "bolt" | "heart";
};

/**
 * IMPORTANT:
 * These MUST exist in: frontend/public/posters/
 * poster-1.(png|jpg) ... poster-7.(png|jpg)
 */
const heroPosters: HeroPoster[] = [
  { base: "poster-1", className: "left-[46%] top-[18%] -translate-x-1/2 rotate-[-10deg] z-50 scale-[1.08]" },
  { base: "poster-2", className: "left-[12%] top-[12%] rotate-[-12deg] z-30" },
  { base: "poster-3", className: "right-[12%] top-[12%] rotate-[9deg] z-30" },
  { base: "poster-4", className: "left-[16%] top-[44%] rotate-[-7deg] z-35" },
  { base: "poster-5", className: "right-[12%] top-[44%] rotate-[8deg] z-34" },
  { base: "poster-6", className: "left-[34%] bottom-[12%] rotate-[-4deg] z-32" },
  { base: "poster-7", className: "right-[22%] bottom-[10%] rotate-[11deg] z-33" },
];

const quickLookItems: QuickLookItem[] = [
  {
    title: "Save to My List",
    description: "Pin every show you want to return to in seconds.",
    icon: "pin",
  },
  {
    title: "Mark status instantly",
    description: "Planned, Watching, Completed, or Dropped with a single tap.",
    icon: "bolt",
  },
  {
    title: "Favorites with one tap",
    description: "Lift your comfort shows to the top of your list.",
    icon: "heart",
  },
];

const resolvePosterSrc = (base: string, attempt: "png" | "jpg") =>
  `/posters/${base}.${attempt}`;

const fallbackHighlights: Highlights = {
  topRated: [
    { title: "Demon Saga", slug: "demon-saga", posterUrl: "/posters/poster-1.png" },
    { title: "Blade Run", slug: "blade-run", posterUrl: "/posters/poster-2.png" },
    { title: "Skybound", slug: "skybound", posterUrl: "/posters/poster-3.png" },
  ],
  recent2025: [
    { title: "Neon Drift", slug: "neon-drift", posterUrl: "/posters/poster-4.png" },
    { title: "Eclipse Notes", slug: "eclipse-notes", posterUrl: "/posters/poster-5.png" },
    { title: "Aurora Stride", slug: "aurora-stride", posterUrl: "/posters/poster-6.png" },
  ],
  trending: [
    { title: "Pulse Shifters", slug: "pulse-shifters", posterUrl: "/posters/poster-7.png" },
    { title: "Mythbound", slug: "mythbound", posterUrl: "/posters/poster-1.png" },
    { title: "Star Relay", slug: "star-relay", posterUrl: "/posters/poster-2.png" },
  ],
  comingSoon: [
    { title: "Crystal Arc", slug: "crystal-arc", posterUrl: "/posters/poster-3.png" },
    { title: "Violet Crest", slug: "violet-crest", posterUrl: "/posters/poster-4.png" },
    { title: "Harbor Lights", slug: "harbor-lights", posterUrl: "/posters/poster-5.png" },
  ],
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatRating(value?: number | null) {
  if (value == null || Number.isNaN(value)) return "N/A";
  return value.toFixed(1);
}

export default function HomePage() {
  const [highlights, setHighlights] = useState<Highlights>({
    topRated: [],
    recent2025: [],
    trending: [],
    comingSoon: [],
  });
  const [externalHighlights, setExternalHighlights] = useState<ExternalHighlight[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [mounted, setMounted] = useState(false);

  const { ref: heroRef, inView: heroInView } = useInView<HTMLDivElement>({ threshold: 0.15 });
  const { ref: featuresRef, inView: featuresInView } = useInView<HTMLDivElement>({ threshold: 0.1 });
  const { ref: highlightsRef, inView: highlightsInView } = useInView<HTMLDivElement>({ threshold: 0.1 });
  const { ref: contactRef, inView: contactInView } = useInView<HTMLDivElement>({ threshold: 0.1 });

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactStatus, setContactStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      setState("loading");

      let data: { highlights?: Highlights; external?: ExternalHighlight[] } | null = null;

      try {
        const res = await fetch("/api/highlights", { cache: "no-store" });

        if (res.ok) {
          const contentType = res.headers.get("content-type") ?? "";
          if (contentType.includes("application/json")) {
            data = (await res.json()) as { highlights?: Highlights; external?: ExternalHighlight[] };
          } else {
            console.warn("Highlights endpoint responded without JSON. Using fallback.");
          }
        } else {
          console.warn(`Highlights endpoint unavailable (${res.status} ${res.statusText}). Using fallback.`);
        }
      } catch (err) {
        console.warn("Highlights fetch failed, using fallback.", err);
      }

      if (!active) return;

      setHighlights(data?.highlights ?? fallbackHighlights);
      setExternalHighlights(data?.external ?? []);
      setState("ready");
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const featureItems = useMemo(
    () => [
      {
        tag: "WL",
        title: "Watchlist you control",
        body: "Plan what to watch next, keep up weekly, and celebrate when you finish a series.",
      },
      {
        tag: "API",
        title: "Smooth browsing",
        body: "Find new shows fast with clean navigation that keeps spoilers out of sight.",
      },
      {
        tag: "FX",
        title: "Smart filters",
        body: "Sort by vibe, year, or favorites so you always land on the right pick.",
      },
      {
        tag: "STAT",
        title: "Personalized view",
        body: "See ratings, status, and progress together without digging through menus.",
      },
      {
        tag: "SEC",
        title: "Private by default",
        body: "Your profile and list stay yours with simple controls to update anytime.",
      },
      {
        tag: "GO",
        title: "Quick links",
        body: "Jump straight into any series page and keep the momentum going.",
      },
    ],
    [],
  );

  function scrollToId(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    setContactStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: contactName, email: contactEmail, message: contactMessage }),
      });
      if (!res.ok) throw new Error("failed");
      setContactStatus("sent");
      setContactName("");
      setContactEmail("");
      setContactMessage("");
    } catch {
      setContactStatus("error");
    }
  }

  const heroReveal = mounted && heroInView;

  return (
    <main
      className="relative min-h-screen overflow-hidden text-white"
      style={{
        backgroundImage:
          "linear-gradient(145deg, rgba(69,38,160,0.25), rgba(20,14,62,0.92) 38%, rgba(7,7,20,0.96)), url('/bg/anilog-bg.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(120,87,255,0.18),transparent_32%),radial-gradient(circle_at_82%_26%,rgba(255,88,248,0.14),transparent_38%),radial-gradient(circle_at_50%_80%,rgba(72,190,255,0.12),transparent_45%)] blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_32%,rgba(255,255,255,0.02)),radial-gradient(circle_at_50%_120%,rgba(92,50,168,0.15),transparent_40%)]" />

      <header className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-6">
        <nav className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-4 py-3 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-lg">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold tracking-tight text-white shadow-[0_10px_35px_rgba(99,102,241,0.45)] ring-1 ring-white/20"
            >
              Anilog
            </Link>
            <div className="hidden items-center gap-3 text-sm font-semibold text-white/75 md:flex">
              <Link href="/" className="rounded-full px-3 py-2 transition hover:text-white">
                Home
              </Link>
              <Link href="/browse" className="rounded-full px-3 py-2 transition hover:text-white">
                Browse
              </Link>
              <Link href="/my-list" className="rounded-full px-3 py-2 transition hover:text-white">
                My List
              </Link>
              <Link href="/contact" className="rounded-full px-3 py-2 transition hover:text-white">
                Contact
              </Link>
            </div>
          </div>
          <Link
            href="/account"
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 backdrop-blur hover:bg-white/10"
          >
            My Account
            <span aria-hidden className="text-xs">v</span>
          </Link>
        </nav>
      </header>
      {/* HERO */}
      <section ref={heroRef} className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-8 pt-10 md:pb-12 md:pt-12 lg:pt-16">
        <div className="relative overflow-hidden rounded-[38px] border border-white/15 bg-gradient-to-br from-white/10 via-white/5 to-[#24104b]/60 shadow-[0_50px_140px_rgba(0,0,0,0.65)] ring-1 ring-indigo-400/25 backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(120,97,255,0.28),transparent_45%),radial-gradient(circle_at_86%_22%,rgba(255,117,241,0.22),transparent_48%),radial-gradient(circle_at_55%_95%,rgba(75,190,255,0.18),transparent_48%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(130deg,rgba(255,255,255,0.08),transparent_35%,rgba(99,102,241,0.12)_70%,transparent)] opacity-70" />
          <div className="pointer-events-none absolute inset-[10px] rounded-[30px] border border-white/10 ring-1 ring-white/10" />

          <div className="relative grid gap-10 px-6 py-12 lg:grid-cols-2 lg:gap-14 lg:px-14">
            {/* Left */}
            <div
              className={cx(
                "flex flex-col gap-6 transition-all duration-700",
                heroReveal ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
              )}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] tracking-[0.2em] text-white/90">
                WELCOME TO ANILOG
              </div>

              <div className="space-y-4">
                <h1 className="max-w-2xl text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
                  Anime tracking that keeps you excited.
                </h1>
                <p className="max-w-xl text-white/80">
                  Build a watchlist you trust, celebrate every episode, and always know what to queue next.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/browse"
                    className="rounded-full bg-gradient-to-r from-[#7c6bff] to-[#5a37ff] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_20px_50px_rgba(109,76,255,0.45)] transition hover:-translate-y-0.5"
                  >
                    Browse
                  </Link>
                  <Link
                    href="/my-list"
                    className="rounded-full border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white/90 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15"
                  >
                    My List
                  </Link>
                </div>
                <div className="text-sm text-white/70">
                  <div className="font-semibold text-white/90">Sign in to save across devices</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/70">
                    {["Track", "Review", "Favorites"].map((label) => (
                      <span key={label} className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick look */}
              <div className="mt-4 w-full max-w-[620px] rounded-3xl border border-white/10 bg-[linear-gradient(120deg,rgba(58,30,120,0.6),rgba(34,21,76,0.85),rgba(18,16,48,0.9))] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
                <div className="flex items-center justify-between text-[11px] font-semibold tracking-[0.22em] text-white/80">
                  <span>QUICK LOOK</span>
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-white/85">Live</span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {quickLookItems.map((item) => (
                    <div
                      key={item.title}
                      className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5 shadow-[0_18px_55px_rgba(0,0,0,0.35)] backdrop-blur-xl"
                    >
                      <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/10 text-white">
                        <QuickLookIcon type={item.icon} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{item.title}</div>
                        <div className="mt-1 text-xs leading-relaxed text-white/70">{item.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right (collage) */}
            <div
              className={cx(
                "flex items-center justify-center transition-all duration-700",
                heroReveal ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
              )}
            >
              <HeroPosterCollage posters={heroPosters} show={heroReveal} />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" ref={featuresRef} className="mx-auto w-full max-w-6xl px-4 pt-10 md:pt-14">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="text-[11px] font-semibold tracking-[0.22em] text-indigo-300/70">FEATURES</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Why Anilog</h2>
          </div>
          <Link href="/browse" className="text-sm font-semibold text-indigo-300/80 hover:text-indigo-200">
            Start browsing
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {featureItems.map((item, idx) => (
            <div
              key={item.title}
              className={cx(
                "rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-[#140d36]/60 p-5 shadow-[0_22px_60px_rgba(0,0,0,0.45)] ring-1 ring-indigo-400/10 backdrop-blur-xl transition-all duration-700",
                featuresInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
              )}
              style={{ transitionDelay: `${80 + idx * 70}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-white/80">
                  {item.tag}
                </div>
                <div>
                  <div className="text-base font-semibold">{item.title}</div>
                  <div className="mt-2 text-sm leading-relaxed text-white/65">{item.body}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <section ref={highlightsRef} className="mx-auto w-full max-w-6xl px-4 pb-20 pt-14">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="text-[11px] font-semibold tracking-[0.22em] text-indigo-300/70">HIGHLIGHTS</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">What&apos;s hot on Anilog</h2>
            <p className="mt-2 text-sm text-white/65">Automatically refreshed with top picks and new releases.</p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70 backdrop-blur">
            Always current
          </div>
        </div>

        <div className="mt-6">
          {state === "loading" && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-white/70 backdrop-blur-md">Loading highlights...</div>
          )}

          {state === "ready" && (
            <div className="grid gap-6">
              <div className="grid gap-4 lg:grid-cols-4">
                {(
                  [
                    ["Top rated of all time", highlights.topRated],
                    ["Recent (2025) releases", highlights.recent2025],
                    ["Trending now", highlights.trending],
                    ["Coming soon", highlights.comingSoon],
                  ] as const
                ).map(([title, list], idx) => (
                  <div
                    key={title}
                    className={cx(
                      "rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-[#141036]/70 p-4 shadow-[0_22px_60px_rgba(0,0,0,0.45)] ring-1 ring-indigo-400/10 backdrop-blur-xl transition-all duration-700",
                      highlightsInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
                    )}
                    style={{ transitionDelay: `${80 + idx * 70}ms` }}
                  >
                    <div className="mb-3 text-sm font-semibold text-white/90">{title}</div>
                    <div className="grid gap-3">
                      {list.slice(0, 3).map((a) => (
                        <HighlightAnimeCard
                          key={a._id ?? a.slug ?? a.title}
                          title={a.title}
                          slug={a.slug ?? ""}
                          releaseYear={a.releaseYear ?? undefined}
                          status={a.status}
                          avgRating={
                            typeof a.avgRating === "number"
                              ? a.avgRating
                              : typeof a.averageScore === "number"
                              ? a.averageScore / 10
                              : null
                          }
                          posterUrl={a.localPoster ?? a.posterUrl ?? undefined}
                        />
                      ))}
                      {list.length === 0 && <div className="text-xs text-white/60">No items yet.</div>}
                    </div>
                  </div>
                ))}
              </div>

              {externalHighlights.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-xl">
                  <div className="mb-3 text-sm font-semibold text-white/90">From around the web</div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {externalHighlights.slice(0, 6).map((x) => (
                      <div key={`${x.source}:${x.externalId}`} className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="text-sm font-semibold">{x.title}</div>
                        <div className="mt-1 text-xs text-white/60">
                          {(x.releaseYear ?? "TBD") as string} - {x.status ?? "Status TBD"} - {formatRating(x.avgRating)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CONTACT */}
      <section
        ref={contactRef}
        className="mx-auto w-full max-w-6xl px-4 pb-20"
        suppressHydrationWarning
      >
        <div className="rounded-2xl border border-white/10 bg-black/20 p-6 shadow-[0_18px_55px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-[11px] font-semibold tracking-[0.22em] text-indigo-300/70">CONTACT</div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Contact us</h2>
              <p className="mt-2 max-w-xl text-sm text-white/65">
                Have a feature request or found a bug? Send a message and we&apos;ll get back to you.
              </p>
            </div>
            <div className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70 backdrop-blur md:block">
              Usually replies in 1-2 days
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <form
              onSubmit={handleContactSubmit}
              className="grid gap-4 md:grid-cols-2"
              suppressHydrationWarning
            >
              <div className="md:col-span-1">
                <label className="text-xs font-semibold text-white/70">Name</label>
                <input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-white/30 focus:border-indigo-300/30"
                  placeholder="Your name"
                  suppressHydrationWarning
                />
              </div>

              <div className="md:col-span-1">
                <label className="text-xs font-semibold text-white/70">Email</label>
                <input
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-white/30 focus:border-indigo-300/30"
                  placeholder="you@example.com"
                  suppressHydrationWarning
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-white/70">Message</label>
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="mt-2 min-h-[120px] w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-white/30 focus:border-indigo-300/30"
                  placeholder="What&apos;s on your mind?"
                  suppressHydrationWarning
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-between gap-4">
                <button
                  type="submit"
                  disabled={contactStatus === "sending"}
                  className="rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(99,102,241,0.35)] transition hover:bg-indigo-400 disabled:opacity-60"
                >
                  {contactStatus === "sending" ? "Sending..." : "Send message"}
                </button>

                {contactStatus === "sent" && <div className="text-sm text-emerald-300">Sent.</div>}
                {contactStatus === "error" && <div className="text-sm text-red-300">Failed. Try again.</div>}
              </div>
            </form>

            <div className={cx(
              "rounded-2xl border border-white/10 bg-white/5 p-5 transition-all duration-700",
              contactInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
            )}>
              <div className="text-sm font-semibold text-white/90">Quick links</div>
              <div className="mt-3 grid gap-2 text-sm">
                <Link href="/browse" className="text-indigo-200/80 hover:text-indigo-200">
                  Browse anime -&gt;
                </Link>
                <Link href="/my-list" className="text-indigo-200/80 hover:text-indigo-200">
                  Your list -&gt;
                </Link>
                <Link href="/contact" className="text-indigo-200/80 hover:text-indigo-200">
                  Contact page -&gt;
                </Link>
              </div>

              <div className="mt-6 text-xs text-white/55">
                Tip: If you still see a hydration warning, disable browser extensions that inject DOM attributes (ad blockers, privacy tools) and hard refresh.
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-6xl px-4 pb-10 text-xs text-white/45">
        (c) {new Date().getFullYear()} Anilog - Built for your watchlist obsession.
      </footer>
    </main>
  );
}

function PosterImage({ base, alt, priority }: { base: string; alt: string; priority?: boolean }) {
  const [src, setSrc] = useState(resolvePosterSrc(base, "png"));
  const [triedJpg, setTriedJpg] = useState(false);
  const [triedFallbackPng, setTriedFallbackPng] = useState(false);
  const [triedFallbackJpg, setTriedFallbackJpg] = useState(false);

  const handleError = () => {
    if (!triedJpg) {
      setSrc(resolvePosterSrc(base, "jpg"));
      setTriedJpg(true);
      return;
    }
    if (!triedFallbackPng) {
      setSrc("/posters/fallback.png");
      setTriedFallbackPng(true);
      return;
    }
    if (!triedFallbackJpg) {
      setSrc("/posters/fallback.jpg");
      setTriedFallbackJpg(true);
    }
  };

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(min-width: 1024px) 220px, (min-width: 768px) 180px, (min-width: 640px) 150px, 120px"
      className="h-full w-full object-cover"
      priority={priority}
      onError={handleError}
    />
  );
}

function HeroPosterCollage({ posters, show }: { posters: HeroPoster[]; show: boolean }) {
  return (
    <div className={cx("relative h-[560px] w-full max-w-[720px] perspective-[1600px]", show ? "scale-100" : "scale-[0.98]")}>
      <div className="absolute -inset-14 rounded-[64px] bg-[radial-gradient(circle_at_22%_20%,rgba(99,102,241,0.28),transparent_42%),radial-gradient(circle_at_80%_35%,rgba(168,85,247,0.22),transparent_45%),radial-gradient(circle_at_50%_78%,rgba(56,189,248,0.18),transparent_45%)] blur-3xl" />
      <div className="relative h-full w-full transform-gpu [transform:perspective(1600px)_rotateY(-12deg)_rotateX(2deg)_rotateZ(6deg)]">
      <div className="absolute inset-0 rounded-[42px] border border-white/10 bg-white/5 ring-1 ring-indigo-300/20 shadow-[0_40px_110px_rgba(0,0,0,0.65)] backdrop-blur-xl" />
        <div className="absolute inset-3 rounded-[38px] border border-white/10 bg-gradient-to-br from-white/10 via-transparent to-indigo-400/18 ring-1 ring-white/10" />
        <div className="absolute inset-6 rounded-[34px] border border-indigo-400/35 bg-black/40 ring-1 ring-indigo-400/25 shadow-inner" />
        <div className="absolute inset-9 rounded-[30px] bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.14),transparent_44%),radial-gradient(circle_at_78%_70%,rgba(99,102,241,0.26),transparent_44%)] ring-1 ring-white/5" />
        <div className="pointer-events-none absolute inset-0 rounded-[42px] bg-[linear-gradient(120deg,rgba(255,255,255,0.3),rgba(255,255,255,0.12)_42%,rgba(99,102,241,0.22)_70%,transparent)] opacity-75" />
        <div className="pointer-events-none absolute inset-0 rounded-[42px] bg-[linear-gradient(135deg,rgba(255,255,255,0.18),transparent_55%)] mix-blend-screen" />

        <div className="absolute inset-10 overflow-visible rounded-[28px]">
          {posters.map((poster, idx) => (
            <div
              key={poster.base}
              className={cx(
                "absolute aspect-[2/3] w-[120px] sm:w-[150px] md:w-[180px] lg:w-[220px] overflow-hidden rounded-2xl border border-white/15 bg-white/5 shadow-[0_32px_90px_rgba(0,0,0,0.62)] ring-1 ring-indigo-300/25 backdrop-blur-md transition-transform duration-500",
                poster.className,
              )}
              style={{ transitionDelay: `${120 + idx * 40}ms` }}
            >
              <PosterImage base={poster.base} alt={`${poster.base} poster`} priority={idx === 0} />
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_55%)] mix-blend-screen" />
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuickLookIcon({ type }: { type: QuickLookItem["icon"] }) {
  switch (type) {
    case "pin":
      return (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 5v14" />
          <path d="M7 10h10" />
          <path d="M10 19h4" />
        </svg>
      );
    case "bolt":
      return (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M13 3 6 14h6l-1 7 8-11h-6z" />
        </svg>
      );
    case "heart":
      return (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 20.5 10.55 19.2C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 10.7L12 20.5z" />
        </svg>
      );
    default:
      return null;
  }
}
