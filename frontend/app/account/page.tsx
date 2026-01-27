"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, saveToken } from "@/lib/api";

type AccountSummary = {
  user: { username: string; email: string; dob?: string };
  stats: {
    total: number;
    byStatus: { planned: number; watching: number; completed: number; dropped: number };
    mostWatchedGenre: string | null;
    topGenres: { genre: string; count: number }[];
  };
};

type LoadState = "loading" | "error" | "unauthorized" | "ready";

export default function AccountPage() {
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const controller = new AbortController();

    const loadSummary = async () => {
      try {
        setError(null);
        setState("loading");

        const res = await apiFetch("/api/account/summary", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (res.status === 401) {
          setState("unauthorized");
          return;
        }

        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`);
        }

        const data: AccountSummary = await res.json();
        setSummary(data);
        setState("ready");
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError((err as Error).message || "Failed to load account");
        setState("error");
      }
    };

    loadSummary();

    return () => controller.abort();
  }, []);

  const formattedDob =
    summary?.user?.dob && !Number.isNaN(new Date(summary.user.dob).getTime())
      ? new Date(summary.user.dob).toLocaleDateString()
      : "N/A";

  const submitDelete = async () => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await apiFetch("/api/auth/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });

      if (res.status === 401) {
        setDeleteError("Invalid password. Please try again.");
        setDeleteLoading(false);
        return;
      }
      if (!res.ok) {
        setDeleteError("Could not delete account. Please try again.");
        setDeleteLoading(false);
        return;
      }

      saveToken(null);
      await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      setSuccessMessage("Account deleted. Redirecting…");
      setDeleteLoading(false);
      setDeleteOpen(false);
      setTimeout(() => router.replace("/login?deleted=1"), 300);
    } catch (err) {
      setDeleteError("Something went wrong. Please try again.");
      setDeleteLoading(false);
    }
  };

  if (state === "loading") {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-zinc-50 via-white to-indigo-50 text-zinc-900">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(2)].map((_, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-zinc-200 bg-white/80 p-5 shadow-sm"
              >
                <div className="mb-3 h-5 w-2/3 animate-pulse rounded bg-zinc-200" />
                <div className="mb-2 h-4 w-full animate-pulse rounded bg-zinc-200" />
                <div className="mb-2 h-4 w-5/6 animate-pulse rounded bg-zinc-200" />
                <div className="mt-4 h-10 w-24 animate-pulse rounded bg-zinc-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (state === "unauthorized") {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-zinc-50 via-white to-indigo-50 text-zinc-900">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-5 text-sm text-amber-800">
            You need to log in to view your account.
            <div className="mt-3">
              <Link
                href="/login"
                className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-zinc-50 via-white to-indigo-50 text-zinc-900">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-800">
            {error || "Something went wrong."}
          </div>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <>
      {successMessage ? (
        <div className="fixed right-4 top-4 z-50 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 shadow-lg">
          {successMessage}
        </div>
      ) : null}

      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-zinc-50 via-white to-indigo-50 text-zinc-900">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="mb-8 flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">
              Account
            </p>
            <h1 className="text-3xl font-semibold text-zinc-900 md:text-4xl">
              Account settings
            </h1>
            <p className="text-sm text-zinc-600 md:text-base">
              View your profile details, watchlist totals, and most watched genres.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-xl border border-zinc-200 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
              <h2 className="text-lg font-semibold text-zinc-900">Profile</h2>
              <dl className="mt-4 space-y-3 text-sm text-zinc-700">
                <div className="flex items-center justify-between rounded-lg bg-zinc-100/60 px-3 py-2">
                  <dt className="font-medium text-zinc-600">Username</dt>
                  <dd className="font-semibold text-zinc-900">{summary.user.username}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-zinc-100/60 px-3 py-2">
                  <dt className="font-medium text-zinc-600">Email</dt>
                  <dd className="font-semibold text-zinc-900">{summary.user.email}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-zinc-100/60 px-3 py-2">
                  <dt className="font-medium text-zinc-600">Date of birth</dt>
                  <dd className="font-semibold text-zinc-900">{formattedDob}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2">
                  <dt className="font-medium text-indigo-700">Most watched genre</dt>
                  <dd className="font-semibold text-indigo-900">
                    {summary.stats.mostWatchedGenre || "N/A"}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-xl border border-zinc-200 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
              <h2 className="text-lg font-semibold text-zinc-900">Watchlist stats</h2>
              <div className="mt-4 grid gap-3 text-sm text-zinc-700">
                <div className="flex items-center justify-between rounded-lg bg-zinc-100/60 px-3 py-2">
                  <span className="font-medium text-zinc-600">Total items</span>
                  <span className="text-base font-semibold text-zinc-900">
                    {summary.stats.total}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {(["planned", "watching", "completed", "dropped"] as const).map((status) => (
                    <div
                      key={status}
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-center shadow-sm"
                    >
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        {status}
                      </p>
                      <p className="text-lg font-semibold text-zinc-900">
                        {summary.stats.byStatus[status]}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 shadow-inner">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Top 3 genres
                  </p>
                  {summary.stats.topGenres.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {summary.stats.topGenres.map((entry) => (
                        <span
                          key={entry.genre}
                          className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700"
                        >
                          {entry.genre}
                          <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-indigo-700">
                            {entry.count}
                          </span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-zinc-600">
                      No genre data yet. Add shows to your watchlist to see insights.
                    </p>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <Link
                    href="/watchlist"
                    className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                  >
                    Go to My List
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setDeletePassword("");
                      setDeleteError(null);
                      setDeleteOpen(true);
                    }}
                    className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                  >
                    Delete account
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {deleteOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-2xl"
          >
            <h2 className="text-xl font-semibold text-zinc-900">Delete account</h2>
            <p className="mt-2 text-sm text-zinc-700">
              This will permanently delete your account and related data (watchlist, favorites,
              reviews). This cannot be undone.
            </p>
            <label className="mt-4 block text-sm font-semibold text-zinc-800">
              Confirm with password
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200"
                  placeholder="Enter your password"
                  style={{ WebkitTextFillColor: "#111" }}
                />
            </label>
            {deleteError ? <p className="mt-2 text-sm text-red-600">{deleteError}</p> : null}
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteOpen(false);
                  setDeletePassword("");
                  setDeleteError(null);
                }}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitDelete}
                disabled={deleteLoading || !deletePassword}
                className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
              >
                {deleteLoading ? "Deleting..." : "Delete my account"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

