"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch, saveToken } from "@/lib/api";

type AuthState = "loading" | "authenticated" | "unauthenticated" | "error";

export default function AuthButtons() {
  const [state, setState] = useState<AuthState>("loading");

  const checkSession = async () => {
    try {
      const res = await apiFetch("/api/auth/me", { cache: "no-store" });
      setState(res.ok ? "authenticated" : "unauthenticated");
    } catch {
      setState("error");
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const logout = async () => {
    setState("loading");
    saveToken(null);
    await apiFetch("/api/auth/logout", { method: "POST" });
    setState("unauthenticated");
  };

  if (state === "loading") {
    return (
      <span className="rounded-full bg-zinc-100 px-4 py-2 text-sm text-zinc-500">
        Checking...
      </span>
    );
  }

  if (state === "authenticated") {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/watchlist"
          className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          My List
        </Link>
        <button
          onClick={logout}
          className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
      >
        Login
      </Link>
      <Link
        href="/register"
        className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
      >
        Register
      </Link>
    </div>
  );
}

