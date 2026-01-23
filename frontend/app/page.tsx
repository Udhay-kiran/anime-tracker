"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
  x: number;      // 0..100 (percentage inside the screen)
  y: number;      // 0..100
  r: number;      // rotation in degrees
  s: number;      // scale (1 = normal)
  z: number;      // z-index
};

type QuickLookItem = {
  title: string;
  description: string;
  icon: "pin" | "bolt" | "heart";
};

const NAV_OFFSET_PX = 65; // you used 65 already â€“ keep consistent


const heroPosters: HeroPoster[] = [
  // Back/top row (subtle, higher, smaller)
  { base: "poster-2", x: 68, y: 26, r: 10, s: 0.92, z: 10 },
  { base: "poster-3", x: 80, y: 38, r: 14, s: 0.95, z: 12 },

  // Mid row
  { base: "poster-7", x: 59, y: 44, r: 6,  s: 0.98, z: 20 },
  { base: "poster-4", x: 46, y: 48, r: -3, s: 0.98, z: 18 },

  // Front row (bigger / more focus)
  { base: "poster-1", x: 40, y: 62, r: -8, s: 1.02, z: 30 },
  { base: "poster-6", x: 58, y: 64, r: 3,  s: 1.06, z: 40 },
  { base: "poster-5", x: 68, y: 66, r: 8,  s: 1.08, z: 50 },
];

const quickLookItems: QuickLookItem[] = [
  {
    title: "Save to My List",
    description: "Pin every show you want to return to in seconds.",
    icon: "pin",
  },
  {
    title: "Mark status",
    description: "Planned, Watching, Completed, or Dropped with a single tap.",
    icon: "bolt",
  },
  {
    title: "Favorites",
    description: "Lift your comfort shows to the top of your list.",
    icon: "heart",
  },
];

const resolvePosterSrc = (base: string, attempt: "png" | "jpg") => `/posters/${base}.${attempt}`;
const POSTER_SHADE_OPACITY = 0.55;

const fallbackHighlights: Highlights = { topRated: [], trending: [], recent2025: [], comingSoon: [] };

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
  const [highlightTab, setHighlightTab] = useState<"topRated" | "trending" | "recent2025" | "comingSoon">("topRated");

  const { ref: heroRef, inView: heroInView } = useInView<HTMLDivElement>({ threshold: 0.15 });
  const { ref: featuresRef, inView: featuresInView } = useInView<HTMLDivElement>({ threshold: 0.1 });
  const { ref: highlightsRef, inView: highlightsInView } = useInView<HTMLDivElement>({ threshold: 0.1 });
  const { ref: contactRef, inView: contactInView } = useInView<HTMLDivElement>({ threshold: 0.1 });

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactStatus, setContactStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [contactError, setContactError] = useState<string | null>(null);
  const [mobileFeature, setMobileFeature] = useState<{ title: string; body: string; tag: string } | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const closeSheetButtonRef = useRef<HTMLButtonElement | null>(null);
  const highlightScrollRefs = {
    topRated: useRef<HTMLDivElement>(null),
    trending: useRef<HTMLDivElement>(null),
    recent2025: useRef<HTMLDivElement>(null),
    comingSoon: useRef<HTMLDivElement>(null),
  };

  const aboutParagraphs = [
    "Anilog is a personal anime tracking platform built for people who truly love watching anime, not just collecting lists.",
    "Track what you're watching, discover what's trending, and keep your watchlist organized without distractions or spoilers.",
    "This project started as a student-built passion project and is continuously evolving with new features, better recommendations, and a cleaner experience.",
    "Have ideas, feedback, or found a bug? I'd love to hear from you.",
  ];

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

      const incoming = data?.highlights;

      const mergeCategory = (incomingList: unknown, prevList: Highlights[keyof Highlights]) => {
        const asArray = Array.isArray(incomingList) ? (incomingList as Highlights[keyof Highlights]) : [];
        const base = asArray.length ? asArray : prevList;
        return base.slice(0, 6);
      };

      setHighlights((prev) => ({
        topRated: mergeCategory(incoming?.topRated, prev.topRated),
        trending: mergeCategory(incoming?.trending, prev.trending),
        recent2025: mergeCategory(incoming?.recent2025, prev.recent2025),
        comingSoon: mergeCategory(incoming?.comingSoon, prev.comingSoon),
      }));
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

  const emailRegex = /^[\w.!#$%&'*+/=?^`{|}~-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = contactName.trim();
    const trimmedEmail = contactEmail.trim();
    const trimmedMessage = contactMessage.trim();

    if (!trimmedName) {
      setContactStatus("error");
      setContactError("Name cannot be empty.");
      return;
    }
    if (!trimmedEmail) {
      setContactStatus("error");
      setContactError("Email cannot be empty.");
      return;
    }
    if (!emailRegex.test(trimmedEmail)) {
      setContactStatus("error");
      setContactError("Email is not valid.");
      console.warn("Invalid email format");
      return;
    }
    if (!trimmedMessage) {
      setContactStatus("error");
      setContactError("Message cannot be empty.");
      return;
    }
    setContactStatus("sending");
    setContactError(null);
    try {
      const res = await fetch(`${apiBase}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail, message: trimmedMessage }),
      });
      if (!res.ok) {
        const text = await res.text();
        setContactError(text || "Invalid Details. Please try again.");
        console.error("Contact submit failed:", text);
        throw new Error("failed");
      }
      setContactStatus("sent");
      setContactName("");
      setContactEmail("");
      setContactMessage("");
    } catch (err) {
      setContactStatus("error");
      if (!contactError) setContactError("Invalid Details. Please try again.");
      console.error("Contact submit error", err);
    }
  }

  const [heroShown, setHeroShown] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (heroInView) setHeroShown(true);
    const t = setTimeout(() => setHeroShown(true), 150);
    return () => clearTimeout(t);
  }, [heroInView]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!mobileFeature) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileFeature(null);
    };

    const prevOverflow = typeof document !== "undefined" ? document.body.style.overflow : "";
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
    }

    window.addEventListener("keydown", handleKey);
    const t = window.setTimeout(() => closeSheetButtonRef.current?.focus(), 0);

    return () => {
      window.removeEventListener("keydown", handleKey);
      clearTimeout(t);
      if (typeof document !== "undefined") {
        document.body.style.overflow = prevOverflow;
      }
    };
  }, [mobileFeature]);

  const heroReveal = heroShown || (mounted && heroInView);
  const GLASS_PANEL =
    "rounded-3xl border border-white/15 bg-gradient-to-br from-black/30 via-[#140d36]/50 to-[#0c0a23]/60 shadow-[0_22px_60px_rgba(0,0,0,0.55)] ring-1 ring-indigo-400/12 backdrop-blur-xl";

  const highlightCategories = [
    { key: "topRated" as const, title: "Top rated of all time", list: highlights.topRated },
    { key: "recent2025" as const, title: "Recent (2025) releases", list: highlights.recent2025 },
    { key: "trending" as const, title: "Trending now", list: highlights.trending },
    { key: "comingSoon" as const, title: "Coming soon", list: highlights.comingSoon },
  ];

  return (
    <main
  className="relative min-h-screen overflow-x-hidden text-white"
  style={{
    backgroundImage: "url('/bg/anilog-bg.webp')",
    backgroundSize: "cover",
    backgroundPosition: "center top",
    backgroundRepeat: "no-repeat",
    backgroundAttachment: "fixed",
  }}
>
      <style>{`
        @keyframes poster-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      {/* (These were doing nothing, keeping but harmless) */}
      <div className="pointer-events-none absolute inset-0 opacity-0" />
      <div className="pointer-events-none absolute inset-0 opacity-0" />

      {/* HERO */}
      <section
  ref={heroRef}
  className="relative z-10 mx-auto w-full max-w-screen-2xl px-4 pt-5 sm:px-6 sm:pt-6 lg:px-8"
>
        {/* HERO CARD â€” single layer, fully transparent fill */}
        <div
          className="
            relative mx-auto w-full
            overflow-hidden
            rounded-xl
            bg-transparent
            backdrop-blur-none
            shadow-[0_30px_80px_rgba(0,0,0,0.28)]
          "
          style={{
  height: `calc(100svh - ${NAV_OFFSET_PX}px - 12px)`,
  maxHeight: 600,
}}
        >
          {/* Grid container */}
          <div
            className="
              grid gap-8 px-4 py-4 sm:px-6 md:px-5 md:py-5
              md:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]
              md:items-start
              lg:grid-cols-[minmax(0,560px)_1fr]
            "
          >
            {/* LEFT */}
            <div
              className={cx(
                "relative flex h-full min-w-0 flex-col justify-between pb-6 transition-all duration-700 md:pb-0",
                heroReveal ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
              )}
            >
              <div
                className="pointer-events-none absolute inset-0 -z-10 lg:hidden opacity-20 blur-3xl"
                style={{
                  backgroundImage: "url('/posters/poster-1.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div className="space-y-2.5 sm:space-y-3.5 lg:space-y-3.5 -mt-1.5">

                <div className="text-sm sm:text-base font-semibold tracking-[0.24em] text-white/85 -mt-0.5">
                WELCOME TO ANILOG !
                </div>


                <div className="space-y-2.5 sm:space-y-3.5 w-full max-w-full min-w-0 sm:max-w-[560px] lg:max-w-[560px] p-0 overflow-hidden break-words mx-auto lg:mx-0">
                  <h1
                    className="w-full max-w-full text-[clamp(2.1rem,6.2vw,3.8rem)] font-semibold leading-[1.05] tracking-tight text-white drop-shadow-[0_1px_10px_rgba(0,0,0,0.35)] break-words text-balance"
                  >
                    Anime tracking that keeps you excited.
                  </h1>


                  <p
                    className="mt-2 w-full max-w-full text-[clamp(1.05rem,2.8vw,1.35rem)] leading-relaxed text-white/85 break-words whitespace-normal text-balance [hyphens:auto] drop-shadow-[0_1px_10px_rgba(0,0,0,0.35)]"
                  >
                    Build a watchlist you trust, celebrate every episode, and always know what to queue next.
                  </p>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Link
                      href="/browse"
                      className="rounded-full bg-gradient-to-r from-[#7c6bff] to-[#5a37ff] px-7 py-3.5 text-base font-semibold text-white shadow-[0_20px_50px_rgba(109,76,255,0.45)] transition hover:-translate-y-0.5"
                    >
                      Browse
                    </Link>
                    <Link
                      href="/my-list"
                      className="rounded-full border border-white/15 px-7 py-3.5 text-base font-semibold text-white/90 backdrop-blur transition hover:-translate-y-0.5"
                    >
                      My List
                    </Link>
                  </div>

                  <div className="text-base text-white/85 drop-shadow-[0_1px_10px_rgba(0,0,0,0.35)] -mt-0.5">
                    <div className="font-semibold text-white">Sign in to save across devices</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-white/80">
                      {["Track", "Review", "Favorites"].map((label) => (
                        <span key={label} className="rounded-full border border-white/15 px-3 py-1">
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* QUICK LOOK ??" remove extra boxes/lines, keep clean */}
              <div className="mt-1 sm:mt-2.5 hidden w-full max-w-[560px] mr-auto rounded-lg border border-white/15 bg-transparent px-6 py-3 md:block">
                <div className="flex items-center justify-between text-[11px] font-semibold tracking-[0.22em] text-white/80">
                  <span>QUICK LOOK</span>
                </div>

                {/* Remove divider lines and mini ??ocard??? visuals */}
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {quickLookItems.map((item) => (
                    <div key={item.title} className="min-w-0">
                      <div className="flex items-center gap-2">
                        {/* no icon box */}
                        <span className="text-white/85">
                          <QuickLookIcon type={item.icon} />
                        </span>
                        <div className="truncate text-sm font-semibold text-white">{item.title}</div>
                      </div>
                      <div className="mt-2 text-xs leading-relaxed text-white/70">{item.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile marquee in place of Quick Look */}
              <div className="mt-5 sm:mt-6 w-full md:hidden">
                <div className="overflow-x-auto no-scrollbar rounded-lg border border-white/15 bg-white/5 px-4 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.35)] ring-1 ring-indigo-300/10 backdrop-blur-lg touch-pan-x">
                  <div
                    className="flex w-max items-stretch gap-3 snap-x snap-mandatory"
                    style={{
                      maskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
                      WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
                      animation: "none",
                    }}
                  >
                    {heroPosters.map((poster, idx) => (
                      <div
                        key={`${poster.base}-ql-${idx}`}
                        className="relative h-[150px] w-[110px] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/12 bg-black/30 shadow-[0_18px_50px_rgba(0,0,0,0.4)] ring-1 ring-indigo-300/15"
                      >
                        <PosterImage base={poster.base} alt={`${poster.base} poster`} priority={idx === 0} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* close LEFT col */}
            </div>

            {/* RIGHT */}
            <div className="hidden md:block">
              <div
                className={cx(
                  "relative flex h-full items-start justify-start transition-all duration-700",
                  heroReveal ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
                )}
              >
                <div className="h-full w-full">
                  <HeroPosterCollage show={true} />
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* FEATURES */}
      <section id="features" ref={featuresRef} className="mx-auto w-full max-w-7xl px-6 lg:px-8 pt-5 sm:pt-6 md:pt-14">
        <div className="flex items-end justify-between gap-4 md:gap-6">
          <div>
            <div className="text-[11px] font-semibold tracking-[0.22em] text-indigo-300/70">FEATURES</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Why Anilog</h2>
          </div>
          <Link href="/browse" className="text-sm font-semibold text-indigo-300/80 hover:text-indigo-200">
            Start browsing
          </Link>
        </div>

        {/* Mobile tiles */}
        <div className="mt-4 grid grid-cols-2 gap-3 md:hidden">
          {featureItems.map((item, idx) => (
            <button
              key={item.title}
              type="button"
              onClick={() => setMobileFeature(item)}
              className={cx(
                "w-full rounded-2xl border border-white/15 bg-black/25 p-4 text-left shadow-[0_18px_50px_rgba(0,0,0,0.35)] ring-1 ring-indigo-400/10 backdrop-blur-xl transition hover:-translate-y-0.5",
                featuresInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
              )}
              style={{ transitionDelay: `${80 + idx * 60}ms` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-base font-semibold leading-snug line-clamp-2">{item.title}</div>
                  <div className="mt-1 text-xs text-white/85 line-clamp-1">Tap to learn more</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Desktop cards */}
        <div className="mt-4 hidden gap-4 md:grid md:grid-cols-3">
          {featureItems.map((item, idx) => (
            <div
              key={item.title}
              className={cx(
                "rounded-2xl border border-white/15 bg-gradient-to-br from-black/30 via-[#140d36]/50 to-[#0c0a23]/60 p-5 shadow-[0_22px_60px_rgba(0,0,0,0.55)] ring-1 ring-indigo-400/12 backdrop-blur-xl transition-all duration-700",
                featuresInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
              )}
              style={{ transitionDelay: `${80 + idx * 70}ms` }}
            >
              <div className="flex items-start gap-3">
                <div>
                  <div className="text-base font-semibold">{item.title}</div>
                  <div className="mt-2 text-sm leading-relaxed text-white/85">{item.body}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {mobileFeature && (
          <div className="md:hidden">
            <div
              className="fixed inset-0 z-50 bg-black/50"
              onClick={() => setMobileFeature(null)}
            />
            <div
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border border-white/10 bg-white/10 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.45)] ring-1 ring-indigo-400/15 backdrop-blur-2xl"
              role="dialog"
              aria-modal="true"
              aria-label={mobileFeature.title}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold tracking-[0.18em] text-indigo-200/80">FEATURE</div>
                  <div className="mt-1 text-lg font-semibold text-white">{mobileFeature.title}</div>
                </div>
                <button
                  ref={closeSheetButtonRef}
                  type="button"
                  onClick={() => setMobileFeature(null)}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/15"
                >
                  Close
                </button>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/80">{mobileFeature.body}</p>
            </div>
          </div>
        )}
      </section>

      {/* HIGHLIGHTS */}
      <section ref={highlightsRef} className="mx-auto w-full max-w-7xl px-6 lg:px-8 pb-14 pt-10 sm:pb-16 sm:pt-12 md:pb-20 md:pt-14">
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
            <div className="rounded-2xl border border-white/10 bg-transparent p-8 text-white/70 backdrop-blur-md">
              Loading highlights...
            </div>
          )}

          {state === "ready" && (
            <div className="space-y-6">
              {/* Mobile/compact: tabs */}
              <div className="space-y-4 md:hidden">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {highlightCategories.map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setHighlightTab(cat.key)}
                      className={cx(
                        "whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition",
                        highlightTab === cat.key
                          ? "border-white/40 bg-white/15 text-white"
                          : "border-white/10 bg-white/5 text-white/70",
                      )}
                    >
                      {cat.title}
                    </button>
                  ))}
                </div>
                {["topRated", "trending"].includes(highlightTab) && (
                  <div className="flex items-center justify-end">
                    <Link
                      href={`/browse?panel=${highlightTab}&slugs=${highlightCategories
                        .find((c) => c.key === highlightTab)
                        ?.list.slice(0, 6)
                        .map((a) => encodeURIComponent(a.slug ?? a._id ?? a.title))
                        .join(",") ?? ""}`}
                      className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/85 transition hover:border-indigo-300 hover:text-white"
                    >
                      See all
                    </Link>
                  </div>
                )}
                {highlightCategories
                  .filter((c) => c.key === highlightTab)
                  .map((cat) => (
                    <div
                      key={cat.key}
                       className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-[#141036]/70 p-3 shadow-[0_22px_60px_rgba(0,0,0,0.45)] ring-1 ring-indigo-400/10 backdrop-blur-xl"
                     >
                      <div className="mb-3 text-sm font-semibold text-white/90">{cat.title}</div>
                      <div className="overflow-x-auto overflow-y-hidden pb-2">
                        <div className="flex w-max gap-3 snap-x snap-mandatory pr-1">
                          {cat.list.slice(0, 6).map((a) => (
                            <div
                              key={a._id ?? a.slug ?? a.title}
                              className="snap-start cursor-default pointer-events-none w-[220px]"
                            >
                              <HighlightAnimeCard
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
                            </div>
                          ))}
                          {cat.list.length === 0 && <div className="text-xs text-white/60">No items yet.</div>}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Desktop/tablet */}
              <div className="hidden md:block">
                <div className="space-y-6 lg:hidden">
                  {highlightCategories.map((cat, idx) => (
                    <div
                      key={cat.key}
                      className={cx(
                          "rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-[#141036]/70 p-3 shadow-[0_22px_60px_rgba(0,0,0,0.45)] ring-1 ring-indigo-400/10 backdrop-blur-xl transition-all duration-700",
                          highlightsInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
                        )}
                      style={{ transitionDelay: `${80 + idx * 70}ms` }}
                    >
                      <div className="mb-3 text-sm font-semibold text-white/90">{cat.title}</div>
                      <div className="overflow-x-auto overflow-y-hidden pb-2">
                        <div className="flex w-max gap-4 snap-x snap-mandatory pr-1">
                          {cat.list.slice(0, 6).map((a) => (
                            <div
                              key={a._id ?? a.slug ?? a.title}
                              className="snap-start cursor-default pointer-events-none w-[280px] lg:w-[300px]"
                            >
                              <HighlightAnimeCard
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
                            </div>
                          ))}
                          {cat.list.length === 0 && <div className="text-xs text-white/60">No items yet.</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
                  {highlightCategories.map((cat, idx) => {
                    const showSeeAll = cat.key === "topRated" || cat.key === "trending";
                    const slugsQuery = cat.list
                      .slice(0, 6)
                      .map((a) => encodeURIComponent(a.slug ?? a._id ?? a.title))
                      .join(",");
                    const seeAllHref = `/browse?panel=${cat.key}&slugs=${slugsQuery}`;
                    return (
                      <div
                        key={cat.key}
                        className={cx(
                          `${GLASS_PANEL} group relative p-3 transition-all duration-700`,
                          highlightsInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
                        )}
                        style={{ transitionDelay: `${80 + idx * 70}ms` }}
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-white/90">{cat.title}</div>
                          {showSeeAll ? (
                            <Link
                              href={seeAllHref}
                              className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80 transition hover:border-indigo-300 hover:text-white"
                            >
                              See all
                            </Link>
                          ) : null}
                        </div>
                        <div className="relative">
                          <div
                            className="overflow-x-auto overflow-y-hidden pb-1 no-scrollbar"
                            ref={highlightScrollRefs[cat.key]}
                          >
                            <div className="flex w-max gap-4 pr-3 snap-x snap-mandatory">
                              {cat.list.slice(0, 6).map((a) => (
                                <div
                                  key={a._id ?? a.slug ?? a.title}
                                  className="snap-start cursor-default pointer-events-none w-[300px] lg:w-[320px]"
                                >
                                  <HighlightAnimeCard
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
                                </div>
                              ))}
                              {cat.list.length === 0 && <div className="text-xs text-white/60">No items yet.</div>}
                            </div>
                          </div>
                          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#141036]/80 via-[#141036]/30 to-transparent" />
                          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[#141036]/80 via-[#141036]/30 to-transparent" />
                          <button
                            type="button"
                            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 bg-black/45 p-2 text-white opacity-0 transition hover:border-indigo-300 hover:text-white group-hover:opacity-100"
                            onClick={() => highlightScrollRefs[cat.key].current?.scrollBy({ left: -320, behavior: "smooth" })}
                            aria-label="Scroll left"
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 bg-black/45 p-2 text-white opacity-0 transition hover:border-indigo-300 hover:text-white group-hover:opacity-100"
                            onClick={() => highlightScrollRefs[cat.key].current?.scrollBy({ left: 320, behavior: "smooth" })}
                            aria-label="Scroll right"
                          >
                            ›
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {externalHighlights.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-xl">
                  <div className="mb-3 text-sm font-semibold text-white/90">From around the web</div>
                  <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory sm:grid sm:grid-cols-2 sm:gap-3 sm:overflow-visible sm:pb-0 lg:grid-cols-3">
                    {externalHighlights.slice(0, 6).map((x) => (
                      <div
                        key={`${x.source}:${x.externalId}`}
                        className="min-w-[230px] snap-start cursor-default rounded-xl border border-white/10 bg-white/5 p-3"
                      >
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
      <section id="contact" ref={contactRef} className="mx-auto w-full max-w-7xl px-6 lg:px-8 pb-14 pt-8 scroll-mt-24 sm:pb-16 md:pb-20 md:pt-10">
        {mounted ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-6 shadow-[0_18px_55px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-8">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="text-[11px] font-semibold tracking-[0.22em] text-indigo-300/70">CONTACT</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">Contact us</h2>
                <p className="mt-2 max-w-xl text-sm text-white/65">
                  Have a feature request or found a bug? Send a message and we&apos;ll get back to you.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <form onSubmit={handleContactSubmit} className="grid gap-4 md:grid-cols-2" suppressHydrationWarning>
                <div className="md:col-span-1" suppressHydrationWarning>
                  <label className="text-xs font-semibold text-white/70">Name</label>
                  <input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-white/30 focus:border-indigo-300/30"
                    placeholder="Your name"
                    suppressHydrationWarning
                  />
                </div>

                <div className="md:col-span-1" suppressHydrationWarning>
                  <label className="text-xs font-semibold text-white/70">Email</label>
                  <input
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-white/30 focus:border-indigo-300/30"
                    placeholder="you@example.com"
                    suppressHydrationWarning
                  />
                </div>

                <div className="md:col-span-2" suppressHydrationWarning>
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

                {contactStatus === "sent" && <div className="text-sm text-emerald-300">Thanks for your message. We'll get in touch with you soon.</div>}
                {contactStatus === "error" && (
                  <div className="text-sm text-red-300">{contactError ?? "Invalid Details. Please try again."}</div>
                )}
                </div>
              </form>

              <div
                className={cx(
                  "hidden md:block rounded-2xl border border-white/10 bg-white/5 p-5 transition-all duration-700",
                  contactInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
                )}
              >
                <div className="flex h-full flex-col justify-center space-y-3">
                  <h3 className="text-xl font-semibold text-white">About Anilog</h3>
                  <div className="text-sm leading-relaxed text-white/70">
                    {aboutParagraphs.map((p, idx) => (
                      <p key={idx} className={idx === 0 ? "" : "mt-3"}>
                        {p}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile About toggle */}
            <div className="md:hidden mt-4">
              <button
                type="button"
                aria-expanded={aboutOpen}
                aria-controls="about-mobile-panel"
                onClick={() => setAboutOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-left text-white backdrop-blur-md"
              >
                <span className="text-sm font-semibold">About Anilog</span>
                <svg
                  className={cx(
                    "h-4 w-4 transition-transform duration-200",
                    aboutOpen ? "rotate-180" : "rotate-0"
                  )}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <div
                id="about-mobile-panel"
                className={cx(
                  "overflow-hidden transition-all duration-300",
                  aboutOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-white/75 backdrop-blur-md">
                  {aboutParagraphs.map((p, idx) => (
                    <p key={idx} className={idx === 0 ? "" : "mt-3"}>
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/15 p-6 text-sm text-white/60 shadow-[0_18px_55px_rgba(0,0,0,0.25)] backdrop-blur-xl md:p-8">
            <div className="text-[11px] font-semibold tracking-[0.22em] text-indigo-300/70">CONTACT</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Contact us</h2>
            <p className="mt-3">Loading contact form...</p>
          </div>
        )}
      </section>
      <footer className="mx-auto w-full max-w-7xl px-6 lg:px-8 pb-10 text-xs text-white/45">
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

function HeroPosterCollage({ show }: { show: boolean }) {
  const posters = [
    { src: "/posters/poster-1.png", alt: "Poster 1" },
    { src: "/posters/poster-2.png", alt: "Poster 2" },
    { src: "/posters/poster-3.png", alt: "Poster 3" },
    { src: "/posters/poster-4.png", alt: "Poster 4" },
    { src: "/posters/poster-5.png", alt: "Poster 5" },
    { src: "/posters/poster-6.png", alt: "Poster 6" },
    { src: "/posters/poster-7.png", alt: "Poster 7" },
  ];

  // current poster index
  const [i, setI] = useState(0);
  // previous poster index (used for crossfade)
  const [prevI, setPrevI] = useState<number | null>(null);
  // whether weâ€™re in the middle of a fade transition
  const [fading, setFading] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;

    const interval = setInterval(() => {
      setPrevI(i);
      const next = (i + 1) % posters.length;
      setI(next);
      setFading(true);

      // fade duration (match the CSS transition duration below)
      const t = setTimeout(() => setFading(false), 550);
      return () => clearTimeout(t);
    }, 6500);

    return () => clearInterval(interval);
  }, [i, paused, posters.length]);

  const current = posters[i];
  const previous = prevI !== null ? posters[prevI] : null;

  return (
    <div
      className={cx(
        "relative w-full max-w-[540px] lg:max-w-[620px]",
        "h-[300px] sm:h-[360px] lg:h-[480px]",
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        "transition-all duration-700"
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute inset-0 rounded-[24px] shadow-[0_30px_80px_rgba(0,0,0,0.4)]" />

      <div className="absolute inset-[12px] overflow-hidden rounded-[20px] bg-black/30">
        {/* PREVIOUS slide (fades OUT) */}
        {previous && (
          <div
            className={cx(
              "absolute inset-0 transition-opacity duration-[550ms]",
              fading ? "opacity-0" : "opacity-0"
            )}
          >
            <HeroNetflixSlide src={previous.src} alt={previous.alt} shade={POSTER_SHADE_OPACITY} />
          </div>
        )}

        {/* CURRENT slide (fades IN) */}
        <div
          className={cx(
            "absolute inset-0 transition-opacity duration-[550ms]",
            prevI === null ? "opacity-100" : fading ? "opacity-100" : "opacity-100"
          )}
        >
          <HeroNetflixSlide src={current.src} alt={current.alt} shade={POSTER_SHADE_OPACITY} />
        </div>
      </div>
    </div>
  );
}

/**
 * Netflix-style slide:
 * - background uses SAME image, softly blurred + dark overlay (fills wide rectangle)
 * - foreground shows the portrait poster sharp and centered
 */
function HeroNetflixSlide({ src, alt, shade }: { src: string; alt: string; shade: number }) {
  return (
    <div className="relative h-full w-full">
      {/* Background fill (blurred version of SAME poster) */}
      <div className="absolute inset-0">
        <Image
          src={src}
          alt=""
          fill
          sizes="(min-width: 1024px) 640px, 520px"
          className="object-cover scale-[1.02] blur-[12px] opacity-60"
          priority
        />
        {/* Darken + vignette so foreground pops */}
        <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${shade})` }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.06),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.28),transparent_20%,transparent_80%,rgba(0,0,0,0.28))]" />
      </div>

      {/* Foreground poster (sharp, centered, portrait) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-[92%] aspect-[2/3] max-w-[360px] sm:max-w-[380px] lg:max-w-[420px] overflow-hidden rounded-[18px] shadow-[0_18px_55px_rgba(0,0,0,0.45)] ring-1 ring-white/10 bg-black/20">
          <Image
            src={src}
            alt={alt}
            fill
            sizes="420px"
            className="object-contain bg-black/15"
            priority
          />
        </div>
      </div>
    </div>
  );
}


function MosaicPoster({
  className,
  src,
  alt,
  priority,
}: {
  className: string;
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cx(
        "relative overflow-hidden",
        // LESS rounding than your current version (closer to target)
        "rounded-xl",
        // Crisp border like the target
        "border border-white/12",
        // Dark depth shadow
        "shadow-[0_28px_90px_rgba(0,0,0,0.60)]",
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 480px, (min-width: 768px) 360px, 280px"
        className="object-cover"
      />
      {/* A tiny glossy highlight like your target (subtle, not blur) */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.18),transparent_45%)] opacity-70" />
      {/* Edge pop */}
      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-white/12" />
    </div>
  );
}


function GridPoster({
  className,
  src,
  alt,
  priority,
}: {
  className: string;
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cx(
        "relative overflow-hidden rounded-2xl border border-white/15",
        "shadow-[0_26px_90px_rgba(0,0,0,0.60)] ring-1 ring-white/10",
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 420px, (min-width: 768px) 320px, 260px"
        className="object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.20),transparent_45%)] opacity-70" />
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/15" />
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

