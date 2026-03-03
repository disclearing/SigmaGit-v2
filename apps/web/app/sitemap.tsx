import { createFileRoute } from "@tanstack/react-router";
import { getApiUrl } from "@/lib/utils";

const STATIC_PATHS = [
  "",
  "/explore",
  "/features",
  "/about",
  "/contact",
  "/gists",
  "/search",
  "/careers",
  "/security",
  "/privacy",
  "/terms",
];

const MAX_REPOS = 2000;
const MAX_USERS = 1000;
const PAGE_SIZE = 100;

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

function urlElement(base: string, path: string, lastmod?: string): string {
  const loc = `${base}${path || "/"}`;
  let xml = `  <url>\n    <loc>${escapeXml(loc)}</loc>`;
  if (lastmod) {
    xml += `\n    <lastmod>${lastmod}</lastmod>`;
  }
  xml += "\n  </url>";
  return xml;
}

export const Route = createFileRoute("/sitemap")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const base = new URL(request.url).origin;
        const apiUrl = getApiUrl();
        const urls: string[] = [];

        // Static routes
        for (const path of STATIC_PATHS) {
          urls.push(urlElement(base, path));
        }

        // Dynamic: public repos and users from API
        if (apiUrl) {
          try {
            let repoOffset = 0;
            let repoCount = 0;
            while (repoCount < MAX_REPOS) {
              const res = await fetch(
                `${apiUrl}/api/repositories/public?sortBy=updated&limit=${PAGE_SIZE}&offset=${repoOffset}`,
                { headers: { Accept: "application/json" } }
              );
              if (!res.ok) break;
              const data = (await res.json()) as {
                repos?: Array<{ owner?: { username?: string }; name?: string; updatedAt?: string }>;
                hasMore?: boolean;
              };
              const repos = data.repos ?? [];
              if (repos.length === 0) break;
              for (const repo of repos) {
                const owner = repo.owner?.username;
                if (owner && repo.name) {
                  const path = `/${owner}/${repo.name}`;
                  const lastmod = repo.updatedAt
                    ? new Date(repo.updatedAt).toISOString().slice(0, 10)
                    : undefined;
                  urls.push(urlElement(base, path, lastmod));
                  repoCount++;
                }
              }
              if (!data.hasMore || repos.length < PAGE_SIZE) break;
              repoOffset += PAGE_SIZE;
            }

            let userOffset = 0;
            let userCount = 0;
            while (userCount < MAX_USERS) {
              const res = await fetch(
                `${apiUrl}/api/users/public?sortBy=newest&limit=${PAGE_SIZE}&offset=${userOffset}`,
                { headers: { Accept: "application/json" } }
              );
              if (!res.ok) break;
              const data = (await res.json()) as {
                users?: Array<{ username?: string }>;
                hasMore?: boolean;
              };
              const users = data.users ?? [];
              if (users.length === 0) break;
              for (const user of users) {
                if (user.username) {
                  urls.push(urlElement(base, `/${user.username}`));
                  userCount++;
                }
              }
              if (!data.hasMore || users.length < PAGE_SIZE) break;
              userOffset += PAGE_SIZE;
            }
          } catch {
            // Continue with static + whatever we have
          }
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

        return new Response(xml, {
          status: 200,
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600, s-maxage=3600",
          },
        });
      },
    },
  },
});
