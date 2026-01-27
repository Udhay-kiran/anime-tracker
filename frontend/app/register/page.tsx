"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, saveToken } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, dob }),
      });
      if (!res.ok) {
        const msg =
          res.status === 409 ? "Email or username already registered" : `Error ${res.status}`;
        throw new Error(msg);
      }
      const data = (await res.json().catch(() => null)) as { token?: string } | null;
      if (data?.token) saveToken(data.token);
      router.push("/account");
    } catch (err) {
      setError((err as Error).message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white">
      <div className="mx-auto max-w-md px-6 py-14">
        <div className="rounded-2xl border border-white/10 bg-white/10 p-8 shadow-lg backdrop-blur">
          <h1 className="text-3xl font-semibold">Register</h1>
          <p className="mt-2 text-sm text-white/80">
            Create an account to save your watchlist and see insights.
          </p>
          <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white shadow-sm backdrop-blur focus:border-indigo-400 focus:outline-none"
              autoComplete="username"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              placeholder="Email"
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white shadow-sm backdrop-blur focus:border-indigo-400 focus:outline-none"
              autoComplete="email"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 characters)"
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white shadow-sm backdrop-blur focus:border-indigo-400 focus:outline-none"
              autoComplete="new-password"
            />
            <label className="text-sm font-medium text-white/80">
              Date of birth
              <input
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white shadow-sm backdrop-blur focus:border-indigo-400 focus:outline-none"
              />
            </label>
            {error && <p className="text-sm text-red-300">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Register"}
            </button>
          </form>
          <p className="mt-4 text-sm text-white/80">
            Already have an account?{" "}
            <Link className="font-semibold text-white hover:text-indigo-200" href="/login">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

