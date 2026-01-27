import Link from "next/link";

const footerLinks = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Browse" },
  { href: "/watchlist", label: "My List" },
  { href: "/account", label: "Account" },
  { href: "/impressum", label: "Impressum" },
  { href: "/datenschutz", label: "Datenschutz" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/60 text-sm text-white/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-white">
          <span className="text-base font-semibold">Anilog</span>
          <span className="text-xs font-medium text-white/70">Track what you watch.</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {footerLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-semibold text-white/75 transition hover:text-indigo-300"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="text-xs text-white/60">
          <p>© {new Date().getFullYear()} Anilog. Built for anime fans.</p>
          <p className="mt-1">
            Student project / demo — non-commercial | Portfolio-Projekt (nicht kommerziell)
          </p>
        </div>
      </div>
    </footer>
  );
}
