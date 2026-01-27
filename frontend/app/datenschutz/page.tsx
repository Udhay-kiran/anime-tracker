import type { Metadata } from "next";

const NAME = "Venkat Pabbathi";
const EMAIL = "psvuk020701@gmail.com";
const LOCATION = "St. Josef Straße, 66115, Saarbrücken, Deutschland";

export const metadata: Metadata = {
  title: "Datenschutz | Anilog",
  robots: { index: false, follow: false },
};

export default function DatenschutzPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-bold text-white md:text-4xl"> Datenschutzerklärung / Data Protection and Privacy Policy</h1>
      <p className="mt-3 text-sm text-white/70">
        Studentisches Portfolio-Projekt (Demo) — nicht kommerziell. / Student portfolio demo — non-commercial.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <h2 className="text-xl font-semibold text-white">Deutsch</h2>
          <div className="mt-3 space-y-3 text-sm text-white/75">
            <p>
              Verantwortlich: {NAME}, {LOCATION}, E-Mail: {EMAIL}
            </p>
            <p>
              Zweck: Bereitstellung von Login und Speicherung deiner Watchlist (Titel, Favoriten, Status). Die
              Verarbeitung erfolgt nur, um deine Liste geräteübergreifend zu sichern.
            </p>
            <p>
              Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertrag/ähnliches Nutzungsverhältnis) für Kontonutzung.
            </p>
            <p>
              Cookies/Session: Technisch notwendige Cookies oder Tokens (z. B. Session/JWT) für Anmeldung und
              Sitzungsverwaltung.
            </p>
            <p>
              Hosting: Die Anwendung wird bei einem Hosting-Provider betrieben; dabei können technische
              Server-Logs anfallen.
            </p>
            <p>
              Keine Werbung: Keine absichtlichen Marketing-Tracker. Falls später Analytics hinzukommen, wird diese
              Erklärung aktualisiert.
            </p>
            <p>
              Deine Rechte: Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch. Bitte wende dich per
              E-Mail an {EMAIL}.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <h2 className="text-xl font-semibold text-white">English</h2>
          <div className="mt-3 space-y-3 text-sm text-white/75">
            <p>
              Controller: {NAME}, {LOCATION}. Contact: {EMAIL}
            </p>
            <p>
              Purpose: Provide login and save your watchlist (titles, favorites, status) so it syncs across devices.
            </p>
            <p>
              Legal basis: Art. 6(1)(b) GDPR (contract-like use) for account features.
            </p>
            <p>
              Cookies/session: Technically necessary cookies or tokens (e.g., session/JWT) for authentication and
              session handling.
            </p>
            <p>
              Hosting: Runs on a hosting provider; technical server logs may be processed there.
            </p>
            <p>
              No ads: We do not intentionally use marketing trackers. If analytics is added in the future, this
              notice will be updated.
            </p>
            <p>
              Your rights: Access, rectification, deletion, restriction, objection. Contact {EMAIL} to exercise them.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
