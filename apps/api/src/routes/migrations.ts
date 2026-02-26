import { Hono } from "hono";
import { db, repositoryMigrations, repositories, users, migrationCredentials } from "@sigmagit/db";
import { eq, and, sql, desc } from "drizzle-orm";
import { authMiddleware, requireAuth, type AuthVariables } from "../middleware/auth";
import { randomUUID } from "crypto";

const app = new Hono<{ Variables: AuthVariables }>();

app.use("*", authMiddleware);

// Helper to encrypt sensitive data (simple base64 for now, should use proper encryption)
function encryptCredential(value: string): string {
  // TODO: Implement proper encryption using environment variable key
  return Buffer.from(value).toString("base64");
}

// Helper to decrypt sensitive data
function decryptCredential(encrypted: string): string {
  // TODO: Implement proper decryption
  return Buffer.from(encrypted, "base64").toString("utf-8");
}

app.post("/api/migrations", requireAuth, async (c) => {
  const user = c.get("user")!;
  const body = await c.req.json();
  const {
    source,
    sourceUrl,
    sourceBaseUrl,
    sourceOwner,
    sourceRepo,
    options,
    credentials,
  } = body;

  // Build the actual source URL based on source type
  let finalSourceUrl = sourceUrl;
  if (source !== "url" && sourceBaseUrl) {
    // Self-hosted instance
    finalSourceUrl = `${sourceBaseUrl}/${sourceOwner}/${sourceRepo}.git`;
  } else if (source !== "url") {
    // Default hosted service
    finalSourceUrl = `https://${source}.com/${sourceOwner}/${sourceRepo}.git`;
  }

  // Create migration record
  const [migration] = await db
    .insert(repositoryMigrations)
    .values({
      userId: user.id,
      source,
      sourceUrl: finalSourceUrl,
      sourceBaseUrl: sourceBaseUrl || null,
      sourceOwner: sourceOwner || null,
      sourceRepo: sourceRepo || null,
      status: "pending",
      progress: 0,
      options: options || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  // Store credentials if provided
  if (credentials && (credentials.authToken || credentials.sshKey)) {
    await db.insert(migrationCredentials).values({
      migrationId: migration.id,
      authToken: credentials.authToken ? encryptCredential(credentials.authToken) : null,
      authType: credentials.authType || "token",
      sshKey: credentials.sshKey ? encryptCredential(credentials.sshKey) : null,
      sshKeyPassphrase: credentials.sshKeyPassphrase
        ? encryptCredential(credentials.sshKeyPassphrase)
        : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

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

// Get credentials for a migration (internal use only, for worker)
app.get("/api/migrations/:id/credentials", requireAuth, async (c) => {
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

  const [creds] = await db
    .select()
    .from(migrationCredentials)
    .where(eq(migrationCredentials.migrationId, id));

  if (!creds) {
    return c.json({ error: "No credentials found" }, 404);
  }

  // Decrypt credentials for the response
  return c.json({
    data: {
      authType: creds.authType,
      authToken: creds.authToken ? decryptCredential(creds.authToken) : null,
      sshKey: creds.sshKey ? decryptCredential(creds.sshKey) : null,
      sshKeyPassphrase: creds.sshKeyPassphrase
        ? decryptCredential(creds.sshKeyPassphrase)
        : null,
    },
  });
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

  // Delete credentials first (cascade should handle this, but being explicit)
  await db
    .delete(migrationCredentials)
    .where(eq(migrationCredentials.migrationId, id));

  await db.delete(repositoryMigrations).where(eq(repositoryMigrations.id, id));

  return c.json({ success: true });
});

// External service integrations
app.get("/api/migrations/github/repos", requireAuth, async (c) => {
  const token = c.req.query("token");

  if (!token) {
    return c.json({ error: "GitHub token required" }, 400);
  }

  return c.json({ error: "GitHub integration not yet implemented" }, 501);
});

app.get("/api/migrations/gitlab/repos", requireAuth, async (c) => {
  const token = c.req.query("token");
  const baseUrl = c.req.query("baseUrl");

  if (!token) {
    return c.json({ error: "GitLab token required" }, 400);
  }

  return c.json({ error: "GitLab integration not yet implemented" }, 501);
});

app.get("/api/migrations/gitea/repos", requireAuth, async (c) => {
  const token = c.req.query("token");
  const baseUrl = c.req.query("baseUrl");

  if (!token) {
    return c.json({ error: "Gitea token required" }, 400);
  }

  if (!baseUrl) {
    return c.json({ error: "Gitea base URL required" }, 400);
  }

  return c.json({ error: "Gitea integration not yet implemented" }, 501);
});

app.get("/api/migrations/bitbucket/repos", requireAuth, async (c) => {
  const token = c.req.query("token");

  if (!token) {
    return c.json({ error: "Bitbucket token required" }, 400);
  }

  return c.json({ error: "Bitbucket integration not yet implemented" }, 501);
});

export default app;
