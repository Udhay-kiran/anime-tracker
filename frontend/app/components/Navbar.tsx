"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiBase } from "@/lib/apiBase";

type SessionUser = {
  username: string;
  email: string;
};

type OpenMenu = "menu" | "account" | null;

export default function Navbar() {
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const API_BASE = apiBase();
  const accountRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileButtonRef = useRef<HTMLButtonElement | null>(null);
  const navRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      setChecking(true);
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
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
      const target = event.target as Node;
      const insideNav = navRef.current?.contains(target);
      const insideAccount = accountRef.current?.contains(target);
      const insideMobileMenu = mobileMenuRef.current?.contains(target);
      const onMobileButton = mobileButtonRef.current?.contains(target);
      if (!insideNav && !insideAccount && !insideMobileMenu && !onMobileButton) {
        setOpenMenu(null);
      }
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore
    } finally {
      setUser(null);
      setOpenMenu(null);
      router.push("/");
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/40 border-b border-white/10 isolate">
      {openMenu !== null && (
        <div
          className="fixed inset-0 z-40 bg-black/35"
          onClick={() => {
            setOpenMenu(null);
          }}
        />
      )}
      <div ref={navRef} className="relative z-50 mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
        <div className="flex items-center gap-5 min-w-0">
          <Link
            href="/"
            className="text-base font-semibold tracking-tight text-white transition hover:drop-shadow-[0_0_12px_rgba(99,102,241,0.45)]"
          >
            Anilog
          </Link>
          <div className="hidden items-center gap-2 text-sm font-semibold md:flex">
            <NavLink href="/" label="Home" />
            <NavLink href="/browse" label="Browse" />
            <NavLink href="/watchlist" label="My List" />
            <Link
              href="/#contact"
              scroll={false}
              className="rounded-lg px-3 py-2 text-white/80 transition hover:text-white hover:drop-shadow-[0_0_10px_rgba(99,102,241,0.35)]"
            >
              Contact
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            ref={mobileButtonRef}
            type="button"
            onClick={() => setOpenMenu((prev) => (prev === "menu" ? null : "menu"))}
            aria-expanded={openMenu === "menu"}
            aria-controls="mobile-nav-menu"
            onPointerDown={(e) => e.stopPropagation()}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-white/85 shadow-sm transition hover:border-white/30 hover:text-white hover:drop-shadow-[0_0_10px_rgba(99,102,241,0.35)] md:hidden"
          >
            Menu
            <span className={`text-xs transition ${openMenu === "menu" ? "rotate-180" : ""}`}>▼</span>
          </button>

          <div ref={accountRef} className="relative" onPointerDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setOpenMenu((prev) => (prev === "account" ? null : "account"))}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white/85 shadow-sm transition hover:border-white/30 hover:text-white hover:drop-shadow-[0_0_10px_rgba(99,102,241,0.35)]"
          >
            My Account
            <span className={`text-xs transition ${openMenu === "account" ? "rotate-180" : ""}`}>v</span>
          </button>

          {openMenu === "account" && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute right-0 z-[60] mt-2 w-64 overflow-hidden rounded-2xl border border-white/12 bg-[#1B1436]/95 bg-clip-padding text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
            >
              {checking ? (
                <div className="px-4 py-3 text-sm text-white/80">
                  Checking session...
                </div>
              ) : user ? (
                <div className="flex flex-col">
                  <div className="border-b border-white/15 px-4 py-3">
                    <p className="text-sm font-semibold text-white">
                      {user.username}
                    </p>
                    <p className="text-xs text-white/80">{user.email}</p>
                  </div>
                  <Link
                    href="/account"
                    onClick={() => setOpenMenu(null)}
                    className="px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Account settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-3 text-left text-sm font-semibold text-rose-100 transition hover:bg-white/10"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpenMenu(null)}
                  className="block px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Login / Register
                </Link>
              )}
            </div>
          )}
        </div>
        </div>

        {openMenu === "menu" && (
          <div
            id="mobile-nav-menu"
            role="menu"
            ref={mobileMenuRef}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute left-4 right-4 top-full z-[60] mt-2 rounded-2xl border border-white/12 bg-[#1B1436]/95 bg-clip-padding px-4 py-3 text-sm font-semibold text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)] md:hidden"
          >
            <div className="flex flex-col divide-y divide-white/10">
              <Link href="/" onClick={() => setOpenMenu(null)} className="py-2">
                Home
              </Link>
              <Link href="/browse" onClick={() => setOpenMenu(null)} className="py-2">
                Browse
              </Link>
              <Link href="/watchlist" onClick={() => setOpenMenu(null)} className="py-2">
                My List
              </Link>
              <Link href="/#contact" scroll={false} onClick={() => setOpenMenu(null)} className="py-2">
                Contact
              </Link>
            </div>
          </div>
        )}
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
      className={`rounded-lg px-3 py-2 transition ${
        isActive
          ? "bg-white/10 text-white font-semibold"
          : "text-white/80 hover:text-white hover:drop-shadow-[0_0_10px_rgba(99,102,241,0.35)]"
      }`}
    >
      {label}
    </Link>
  );
}

