/**
 * Shared SEO and document head helpers for TanStack Router head().
 * Use createMeta() in route definitions for consistent titles, descriptions, and Open Graph / Twitter tags.
 */

const SITE_NAME = "Sigmagit";
const DEFAULT_DESCRIPTION = "Where code lives. Git hosting, pull requests, issues, and collaboration.";
const BASE_URL = typeof window !== "undefined" ? window.location.origin : "https://sigmagit.com";

export interface MetaOptions {
  /** Page title (without site suffix; suffix " | Sigmagit" is added automatically) */
  title: string;
  /** Meta description. Omit to use default. */
  description?: string;
  /** Canonical or current page URL for og:url. Omit for default (base URL). */
  url?: string;
  /** og:image URL. Omit to use default or none. */
  image?: string;
  /** Set to true for admin/auth pages to add noindex, nofollow */
  noIndex?: boolean;
  /** Omit Open Graph and Twitter meta (e.g. for minimal pages). Default false. */
  skipSocial?: boolean;
}

/**
 * Builds the meta array for TanStack Router head(). Use in route head: () => ({ meta: createMeta(...) }).
 */
export function createMeta(options: MetaOptions): Array<{ title?: string; name?: string; content?: string; property?: string }> {
  const { title, description, url, image, noIndex, skipSocial } = options;
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const desc = description ?? DEFAULT_DESCRIPTION;
  const meta: Array<{ title?: string; name?: string; content?: string; property?: string }> = [
    { title: fullTitle },
    { name: "description", content: desc },
  ];

  if (noIndex) {
    meta.push({ name: "robots", content: "noindex, nofollow" });
  }

  if (!skipSocial) {
    meta.push(
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: desc },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url ?? BASE_URL },
    );
    if (image) {
      meta.push({ property: "og:image", content: image });
    }
    meta.push(
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: fullTitle },
      { name: "twitter:description", content: desc },
    );
    if (image) {
      meta.push({ name: "twitter:image", content: image });
    }
  }

  return meta;
}

/** Default meta for root (used as fallback; child routes override title/description). */
export const defaultMeta = createMeta({
  title: SITE_NAME,
  description: DEFAULT_DESCRIPTION,
  skipSocial: false,
});
