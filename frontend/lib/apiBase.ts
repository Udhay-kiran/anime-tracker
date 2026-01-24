export function apiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv.replace(/\/+$/, "");
  }
  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:4000";
  }
  throw new Error("Set NEXT_PUBLIC_API_URL in Vercel ? Project Settings ? Environment Variables");
}