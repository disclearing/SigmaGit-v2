import { normalizeUrl } from "@sigmagit/lib";

export { cn } from "@sigmagit/lib";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

function isLocalUrl(url: string): boolean {
  try {
    return LOCAL_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

export const getApiUrl = () => {
  const isServer = typeof window === "undefined";

  if (isServer) {
    if (process.env.API_URL) {
      return normalizeUrl(process.env.API_URL);
    }
    if (process.env.NODE_ENV !== "production") {
      return "http://localhost:3001";
    }
    return undefined;
  }

  if (import.meta.env.VITE_API_URL) {
    const apiUrl = normalizeUrl(import.meta.env.VITE_API_URL);

    // In production on a public domain, never call browser-side localhost.
    if (import.meta.env.PROD && !LOCAL_HOSTS.has(window.location.hostname) && isLocalUrl(apiUrl)) {
      return undefined;
    }

    return apiUrl;
  }

  if (!import.meta.env.PROD) {
    return "http://localhost:3001";
  }

  return undefined;
};