"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      if (!res.ok) {
        const msg = res.status === 401 ? "Invalid credentials" : `Error ${res.status}`;
        throw new Error(msg);
      }
      router.push("/account");
    } catch (err) {
      setError((err as Error).message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white">
      <div className="mx-auto max-w-md px-6 py-14">
        <div className="rounded-2xl border border-white/10 bg-white/10 p-8 shadow-lg backdrop-blur">
          <h1 className="text-3xl font-semibold">Login</h1>
          <p className="mt-2 text-sm text-white/80">
            Sign in with your email or username to manage your watchlist.
          </p>
          <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Email or Username"
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white shadow-sm backdrop-blur focus:border-indigo-400 focus:outline-none"
              autoComplete="username"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white shadow-sm backdrop-blur focus:border-indigo-400 focus:outline-none"
              autoComplete="current-password"
            />
            {error && <p className="text-sm text-red-300">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
          <div className="mt-4 text-sm text-white/80">
            <p>
              Don't have an account?{" "}
              <Link className="font-semibold text-white hover:text-indigo-200" href="/register">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
