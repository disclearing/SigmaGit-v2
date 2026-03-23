import { Hono } from "hono";
import { db, users, repositories, repositoryCollaborators } from "@sigmagit/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware, type AuthVariables } from "../middleware/auth";
import { sanitizePathForGit } from "../lib/validation";
import { createGitStore, getFile } from "../git";

const app = new Hono<{ Variables: AuthVariables }>();

app.use("*", authMiddleware);

async function canAccessRepository(
  repo: { id: string; ownerId: string; visibility: string },
  currentUser: { id: string } | null
): Promise<boolean> {
  if (repo.visibility === "public") return true;
  if (!currentUser) return false;
  if (currentUser.id === repo.ownerId) return true;
  const collaborator = await db.query.repositoryCollaborators.findFirst({
    where: and(
      eq(repositoryCollaborators.repositoryId, repo.id),
      eq(repositoryCollaborators.userId, currentUser.id)
    ),
  });
  return Boolean(collaborator);
}

app.get("/file/:username/:repo/:branch/*", async (c) => {
  const username = c.req.param("username");
  const repo = c.req.param("repo");
  const branch = c.req.param("branch");
  const rawPath = c.req.param("*") || "";
  const filePath = sanitizePathForGit(rawPath);
  if (filePath === null) {
    return c.json({ error: "Invalid file path" }, 400);
  }
  const currentUser = c.get("user");

  const result = await db
    .select({
      ownerId: repositories.ownerId,
      visibility: repositories.visibility,
      userId: users.id,
      repoName: repositories.name,
    })
    .from(repositories)
    .innerJoin(users, eq(users.id, repositories.ownerId))
    .where(and(eq(users.username, username), eq(repositories.name, repo)))
    .limit(1);

  const row = result[0];
  if (!row) {
    return c.json({ error: "Repository not found" }, 404);
  }

  if (!(await canAccessRepository({ id: row.userId, ownerId: row.ownerId, visibility: row.visibility }, currentUser))) {
    return c.json({ error: "Repository not found" }, 404);
  }

  const store = createGitStore(row.userId, row.repoName);
  const file = await getFile(store.fs, store.dir, branch, filePath);

  if (!file) {
    return c.json({ error: "File not found" }, 404);
  }

  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  const contentType = getContentType(ext);

  return new Response(file.content, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
});

app.options("/file/:username/:repo/:branch/*", (c) => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
});

function getContentType(ext: string): string {
  const contentTypes: Record<string, string> = {
    js: "application/javascript",
    mjs: "application/javascript",
    ts: "text/typescript",
    tsx: "text/typescript",
    jsx: "text/javascript",
    json: "application/json",
    html: "text/html",
    htm: "text/html",
    css: "text/css",
    md: "text/markdown",
    txt: "text/plain",
    xml: "application/xml",
    svg: "image/svg+xml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    ico: "image/x-icon",
    pdf: "application/pdf",
    wasm: "application/wasm",
    yaml: "text/yaml",
    yml: "text/yaml",
    toml: "text/toml",
    sh: "text/x-shellscript",
    bash: "text/x-shellscript",
    zsh: "text/x-shellscript",
    py: "text/x-python",
    rb: "text/x-ruby",
    go: "text/x-go",
    rs: "text/x-rust",
    c: "text/x-c",
    cpp: "text/x-c++",
    h: "text/x-c",
    hpp: "text/x-c++",
    java: "text/x-java",
    kt: "text/x-kotlin",
    swift: "text/x-swift",
    php: "text/x-php",
  };

  return contentTypes[ext] || "application/octet-stream";
}

export default app;
