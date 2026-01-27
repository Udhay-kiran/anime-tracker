import { apiBase } from "./apiBase";

export const TOKEN_KEY = "anilog_token";

export const apiUrl = (path: string) => {
  const base = apiBase();
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
};

export function saveToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Swallow storage errors (e.g., Safari private mode)
  }
}

export async function apiFetch(input: string, init: RequestInit = {}) {
  let token: string | null = null;
  if (typeof window !== "undefined") {
    try {
      token = localStorage.getItem(TOKEN_KEY);
    } catch {
      token = null;
    }
  }

  const headers = new Headers(init.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url =
    input.startsWith("http") || input.startsWith("//")
      ? input
      : `${apiBase()}${input.startsWith("/") ? "" : "/"}${input}`;

  const options: RequestInit = {
    ...init,
    headers,
    credentials: init.credentials ?? "include",
  };

  return fetch(url, options);
}
