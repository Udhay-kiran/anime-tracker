"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type SessionUser = {
  username: string;
  email: string;
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      setChecking(true);
      try {
        const res = await fetch("http://localhost:4000/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setChecking(false);
      }
    };

    loadSession();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("pointerdown", handlePointerDown);
    }

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:4000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore
    } finally {
      setUser(null);
      setOpen(false);
      router.push("/");
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-5">
          <Link
            href="/"
            className="text-base font-semibold text-indigo-700 transition hover:text-indigo-800"
          >
            Anilog
          </Link>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <NavLink href="/" label="Home" />
            <NavLink href="/browse" label="Browse" />
            <NavLink href="/watchlist" label="My List" />
            <Link
              href="/#contact"
              className="rounded-lg px-3 py-2 text-zinc-700 transition hover:bg-zinc-100 hover:text-indigo-700"
            >
              Contact
            </Link>
          </div>
        </div>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-indigo-400 hover:text-indigo-700"
          >
            My Account
            <span className={`text-xs transition ${open ? "rotate-180" : ""}`}>v</span>
          </button>

          {open && (
            <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-zinc-200 bg-white/95 shadow-xl">
              {checking ? (
                <div className="px-4 py-3 text-sm text-zinc-600">
                  Checking session...
                </div>
              ) : user ? (
                <div className="flex flex-col">
                  <div className="border-b border-zinc-200 px-4 py-3">
                    <p className="text-sm font-semibold text-zinc-900">
                      {user.username}
                    </p>
                    <p className="text-xs text-zinc-600">{user.email}</p>
                  </div>
                  <Link
                    href="/account"
                    onClick={() => setOpen(false)}
                    className="px-4 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    Account settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                >
                  Login / Register
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-2 ${
        isActive
          ? "bg-indigo-50 text-indigo-700"
          : "text-zinc-700 transition hover:bg-zinc-100 hover:text-indigo-700"
      }`}
    >
      {label}
    </Link>
  );
}
