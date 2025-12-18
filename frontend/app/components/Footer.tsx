import Link from "next/link";

const footerLinks = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Browse" },
  { href: "/watchlist", label: "My List" },
  { href: "/account", label: "Account" },
];

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white/85 text-sm text-zinc-600 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-zinc-800">
          <span className="text-base font-semibold">Anilog</span>
          <span className="text-xs font-medium text-zinc-500">
            Track what you watch.
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {footerLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-semibold text-zinc-700 transition hover:text-indigo-700"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <p className="text-xs text-zinc-500">
          © {new Date().getFullYear()} Anilog. Built for anime fans.
        </p>
      </div>
    </footer>
  );
}
