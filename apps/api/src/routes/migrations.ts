import { Hono } from "hono";
import { db, repositoryMigrations, repositories, users } from "@sigmagit/db";
import { eq, and, sql, desc } from "drizzle-orm";
import { authMiddleware, requireAuth, type AuthVariables } from "../middleware/auth";
import { randomUUID } from "crypto";

const app = new Hono<{ Variables: AuthVariables }>();

app.use("*", authMiddleware);

app.post("/api/migrations", requireAuth, async (c) => {
  const user = c.get("user")!;
  const body = await c.req.json();
  const { source, sourceUrl, sourceOwner, sourceRepo, options } = body;

  const [migration] = await db
    .insert(repositoryMigrations)
    .values({
      userId: user.id,
      source,
      sourceUrl,
      sourceOwner,
      sourceRepo,
      status: "pending",
      progress: 0,
      options: options || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return c.json({ data: migration });
});

app.get("/api/migrations", requireAuth, async (c) => {
  const user = c.get("user")!;
  const limit = parseInt(c.req.query("limit") || "20", 10);
  const offset = parseInt(c.req.query("offset") || "0", 10);

  const migrations = await db
    .select()
    .from(repositoryMigrations)
    .where(eq(repositoryMigrations.userId, user.id))
    .orderBy(desc(repositoryMigrations.createdAt))
    .limit(limit + 1)
    .offset(offset);

  const hasMore = migrations.length > limit;
  const migrationsData = migrations.slice(0, limit);

  return c.json({ migrations: migrationsData, hasMore });
});

app.get("/api/migrations/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user")!;

  const [migration] = await db
    .select()
    .from(repositoryMigrations)
    .where(
      and(
        eq(repositoryMigrations.id, id),
        eq(repositoryMigrations.userId, user.id)
      )
    );

  if (!migration) {
    return c.json({ error: "Migration not found" }, 404);
  }

  return c.json({ data: migration });
});

app.post("/api/migrations/:id/cancel", requireAuth, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user")!;

  const [migration] = await db
    .select()
    .from(repositoryMigrations)
    .where(
      and(
        eq(repositoryMigrations.id, id),
        eq(repositoryMigrations.userId, user.id)
      )
    );

  if (!migration) {
    return c.json({ error: "Migration not found" }, 404);
  }

  if (migration.status === "completed" || migration.status === "failed") {
    return c.json({ error: "Cannot cancel completed migration" }, 400);
  }

  await db
    .update(repositoryMigrations)
    .set({ status: "failed", errorMessage: "Cancelled by user", updatedAt: new Date() })
    .where(eq(repositoryMigrations.id, id));

  return c.json({ success: true });
});

app.delete("/api/migrations/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user")!;

  const [migration] = await db
    .select()
    .from(repositoryMigrations)
    .where(
      and(
        eq(repositoryMigrations.id, id),
        eq(repositoryMigrations.userId, user.id)
      )
    );

  if (!migration) {
    return c.json({ error: "Migration not found" }, 404);
  }

  await db.delete(repositoryMigrations).where(eq(repositoryMigrations.id, id));

  return c.json({ success: true });
});

app.get("/api/migrations/github/repos", requireAuth, async (c) => {
  const user = c.get("user")!;
  const token = c.req.query("token");

  if (!token) {
    return c.json({ error: "GitHub token required" }, 400);
  }

  return c.json({ error: "GitHub integration not yet implemented" }, 501);
});

app.get("/api/migrations/gitlab/repos", requireAuth, async (c) => {
  const user = c.get("user")!;
  const token = c.req.query("token");

  if (!token) {
    return c.json({ error: "GitLab token required" }, 400);
  }

  return c.json({ error: "GitLab integration not yet implemented" }, 501);
});

app.get("/api/migrations/bitbucket/repos", requireAuth, async (c) => {
  const user = c.get("user")!;
  const token = c.req.query("token");

  if (!token) {
    return c.json({ error: "Bitbucket token required" }, 400);
  }

  return c.json({ error: "Bitbucket integration not yet implemented" }, 501);
});

export default app;
