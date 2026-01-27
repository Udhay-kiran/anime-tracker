import type { Metadata } from "next";

const NAME = "Venkat Pabbathi";
const EMAIL = "psvuk020701@gmail.com";
const LOCATION = "St. Josef Straße, 66115, Saarbrücken, Deutschland";

export const metadata: Metadata = {
  title: "Impressum | Anilog",
  robots: { index: false, follow: false },
};

export default function ImpressumPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-bold text-white md:text-4xl">Impressum / Legal Notice</h1>
      <p className="mt-3 text-sm text-white/70">
        Studentisches Portfolio-Projekt (Demo) — nicht kommerziell. / Student portfolio demo — non-commercial.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <h2 className="text-xl font-semibold text-white">Deutsch</h2>
          <ul className="mt-3 space-y-2 text-sm text-white/75">
            <li>
              <span className="font-semibold text-white">Name:</span> {NAME}
            </li>
            <li>
              <span className="font-semibold text-white">Ort:</span> {LOCATION}
            </li>
            <li>
              <span className="font-semibold text-white">E-Mail:</span> {EMAIL}
            </li>
            <li className="pt-2 text-white/80">
              Privates Studenten- und Portfolio-Projekt, nicht kommerziell. Kein öffentliches Angebot, keine
              Garantie auf Verfügbarkeit oder Vollständigkeit.
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <h2 className="text-xl font-semibold text-white">English</h2>
          <ul className="mt-3 space-y-2 text-sm text-white/75">
            <li>
              <span className="font-semibold text-white">Name:</span> {NAME}
            </li>
            <li>
              <span className="font-semibold text-white">Location:</span> Saarbrücken, Germany
            </li>
            <li>
              <span className="font-semibold text-white">Email:</span> {EMAIL}
            </li>
            <li className="pt-2 text-white/80">
              Personal student & portfolio project for demonstration / job applications only. Non-commercial. No
              guarantee of availability or completeness.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
