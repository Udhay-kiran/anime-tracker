import WatchlistClient, { TabKey } from "./WatchlistClient";

const VALID_TABS: TabKey[] = ["favorites", "planned", "watching", "completed", "dropped"];

function normalizeTab(tab: unknown): TabKey {
  const t = typeof tab === "string" ? (tab as TabKey) : "favorites";
  return VALID_TABS.includes(t) ? t : "favorites";
}

export default function Page({ searchParams }: { searchParams?: { tab?: string } }) {
  const initialTab = normalizeTab(searchParams?.tab);
  return <WatchlistClient initialTab={initialTab} />;
}
