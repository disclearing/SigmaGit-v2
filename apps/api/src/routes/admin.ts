import { Hono } from "hono";
import { db, users, repositories, auditLogs, systemSettings } from "@sigmagit/db";
import { eq, sql, desc, count, and, or, ilike } from "drizzle-orm";
import { authMiddleware, requireAuth, requireAdmin, type AuthVariables } from "../middleware/auth";

const app = new Hono<{ Variables: AuthVariables }>();

app.use("*", authMiddleware);
app.use("*", requireAdmin);

export async function logAuditEvent(
  actorId: string,
  action: string,
  targetType: string,
  targetId?: string,
  metadata?: Record<string, unknown>,
  ipAddress?: string
) {
  await db.insert(auditLogs).values({
    actorId,
    action,
    targetType,
    targetId,
    metadata,
    ipAddress,
  });
}

app.get("/api/admin/stats", async (c) => {
  const [userCount] = await db.select({ count: count() }).from(users);
  const [repoCount] = await db.select({ count: count() }).from(repositories);
  const [publicRepoCount] = await db
    .select({ count: count() })
    .from(repositories)
    .where(eq(repositories.visibility, "public"));
  const [privateRepoCount] = await db
    .select({ count: count() })
    .from(repositories)
    .where(eq(repositories.visibility, "private"));
  const [adminCount] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.role, "admin"));
  const [moderatorCount] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.role, "moderator"));

  return c.json({
    userCount: Number(userCount.count),
    repoCount: Number(repoCount.count),
    publicRepoCount: Number(publicRepoCount.count),
    privateRepoCount: Number(privateRepoCount.count),
    adminCount: Number(adminCount.count),
    moderatorCount: Number(moderatorCount.count),
  });
});

app.get("/api/admin/users", async (c) => {
  const search = c.req.query("search") || "";
  const role = c.req.query("role");
  const limit = parseInt(c.req.query("limit") || "20", 10);
  const offset = parseInt(c.req.query("offset") || "0", 10);

  const conditions = [];

  if (search) {
    conditions.push(
      or(
        ilike(users.name, `%${search}%`),
        ilike(users.username, `%${search}%`),
        ilike(users.email, `%${search}%`)
      )
    );
  }

  if (role) {
    conditions.push(eq(users.role, role as "user" | "admin" | "moderator"));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const usersResult = await db
    .select()
    .from(users)
    .where(whereClause)
    .orderBy(desc(users.createdAt))
    .limit(limit + 1)
    .offset(offset);

  const hasMore = usersResult.length > limit;
  const usersData = usersResult.slice(0, limit);

  return c.json({
    users: usersData,
    hasMore,
  });
});

app.get("/api/admin/users/:id", async (c) => {
  const id = c.req.param("id");

  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
  });

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const [repoCount] = await db
    .select({ count: count() })
    .from(repositories)
    .where(eq(repositories.ownerId, id));

  return c.json({
    ...user,
    repoCount: Number(repoCount.count),
  });
});

app.patch("/api/admin/users/:id", async (c) => {
  const id = c.req.param("id");
  const actor = c.get("user")!;
  const body = await c.req.json();

  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, id),
  });

  if (!existingUser) {
    return c.json({ error: "User not found" }, 404);
  }

  const updates: Record<string, unknown> = {};
  if (body.role !== undefined) {
    updates.role = body.role;
  }

  await db.update(users).set(updates).where(eq(users.id, id));

  await logAuditEvent(
    actor.id,
    "user.update",
    "user",
    id,
    { changes: body },
    c.req.header("x-forwarded-for") || c.req.header("x-real-ip")
  );

  return c.json({ success: true });
});

app.delete("/api/admin/users/:id", async (c) => {
  const id = c.req.param("id");
  const actor = c.get("user")!;

  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, id),
  });

  if (!existingUser) {
    return c.json({ error: "User not found" }, 404);
  }

  await db.delete(users).where(eq(users.id, id));

  await logAuditEvent(
    actor.id,
    "user.delete",
    "user",
    id,
    { username: existingUser.username },
    c.req.header("x-forwarded-for") || c.req.header("x-real-ip")
  );

  return c.json({ success: true });
});

app.get("/api/admin/repositories", async (c) => {
  const search = c.req.query("search") || "";
  const visibility = c.req.query("visibility");
  const limit = parseInt(c.req.query("limit") || "20", 10);
  const offset = parseInt(c.req.query("offset") || "0", 10);

  const conditions = [];

  if (search) {
    conditions.push(
      or(
        ilike(repositories.name, `%${search}%`),
        ilike(repositories.description, `%${search}%`)
      )
    );
  }

  if (visibility) {
    conditions.push(eq(repositories.visibility, visibility as "public" | "private"));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const reposResult = await db
    .select()
    .from(repositories)
    .where(whereClause)
    .orderBy(desc(repositories.createdAt))
    .limit(limit + 1)
    .offset(offset);

  const hasMore = reposResult.length > limit;
  const reposData = reposResult.slice(0, limit);

  return c.json({
    repositories: reposData,
    hasMore,
  });
});

app.delete("/api/admin/repositories/:id", async (c) => {
  const id = c.req.param("id");
  const actor = c.get("user")!;

  const existingRepo = await db.query.repositories.findFirst({
    where: eq(repositories.id, id),
  });

  if (!existingRepo) {
    return c.json({ error: "Repository not found" }, 404);
  }

  await db.delete(repositories).where(eq(repositories.id, id));

  await logAuditEvent(
    actor.id,
    "repo.delete",
    "repository",
    id,
    { name: existingRepo.name },
    c.req.header("x-forwarded-for") || c.req.header("x-real-ip")
  );

  return c.json({ success: true });
});

app.post("/api/admin/repositories/:id/transfer", async (c) => {
  const id = c.req.param("id");
  const actor = c.get("user")!;
  const body = await c.req.json();
  const { newOwnerId } = body;

  const existingRepo = await db.query.repositories.findFirst({
    where: eq(repositories.id, id),
  });

  if (!existingRepo) {
    return c.json({ error: "Repository not found" }, 404);
  }

  const newOwner = await db.query.users.findFirst({
    where: eq(users.id, newOwnerId),
  });

  if (!newOwner) {
    return c.json({ error: "New owner not found" }, 404);
  }

  await db
    .update(repositories)
    .set({ ownerId: newOwnerId })
    .where(eq(repositories.id, id));

  await logAuditEvent(
    actor.id,
    "repo.transfer",
    "repository",
    id,
    {
      name: existingRepo.name,
      from: existingRepo.ownerId,
      to: newOwnerId,
    },
    c.req.header("x-forwarded-for") || c.req.header("x-real-ip")
  );

  return c.json({ success: true });
});

app.get("/api/admin/audit-logs", async (c) => {
  const action = c.req.query("action");
  const targetType = c.req.query("targetType");
  const limit = parseInt(c.req.query("limit") || "50", 10);
  const offset = parseInt(c.req.query("offset") || "0", 10);

  const conditions = [];

  if (action) {
    conditions.push(ilike(auditLogs.action, `%${action}%`));
  }

  if (targetType) {
    conditions.push(eq(auditLogs.targetType, targetType));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const logsResult = await db
    .select({
      id: auditLogs.id,
      actorId: auditLogs.actorId,
      action: auditLogs.action,
      targetType: auditLogs.targetType,
      targetId: auditLogs.targetId,
      metadata: auditLogs.metadata,
      ipAddress: auditLogs.ipAddress,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .where(whereClause)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit + 1)
    .offset(offset);

  const hasMore = logsResult.length > limit;
  const logsData = logsResult.slice(0, limit);

  const logsWithActors = await Promise.all(
    logsData.map(async (log) => {
      const actor = log.actorId
        ? await db.query.users.findFirst({
            where: eq(users.id, log.actorId),
            columns: { id: true, username: true, name: true },
          })
        : null;

      return {
        ...log,
        actor,
      };
    })
  );

  return c.json({
    logs: logsWithActors,
    hasMore,
  });
});

app.get("/api/admin/settings", async (c) => {
  const settings = await db.select().from(systemSettings);

  const settingsMap: Record<string, unknown> = {};
  for (const setting of settings) {
    settingsMap[setting.key] = setting.value;
  }

  return c.json(settingsMap);
});

app.patch("/api/admin/settings", async (c) => {
  const actor = c.get("user")!;
  const body = await c.req.json();

  for (const [key, value] of Object.entries(body)) {
    await db
      .insert(systemSettings)
      .values({
        key,
        value,
        updatedBy: actor.id,
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value,
          updatedBy: actor.id,
          updatedAt: new Date(),
        },
      });
  }

  await logAuditEvent(
    actor.id,
    "settings.update",
    "system",
    undefined,
    { keys: Object.keys(body) },
    c.req.header("x-forwarded-for") || c.req.header("x-real-ip")
  );

  return c.json({ success: true });
});

app.post("/api/admin/maintenance", async (c) => {
  const actor = c.get("user")!;
  const body = await c.req.json();
  const { enabled } = body;

  await db
    .insert(systemSettings)
    .values({
      key: "maintenance_mode",
      value: enabled,
      updatedBy: actor.id,
    })
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: {
        value: enabled,
        updatedBy: actor.id,
        updatedAt: new Date(),
      },
    });

  await logAuditEvent(
    actor.id,
    "maintenance.toggle",
    "system",
    undefined,
    { enabled },
    c.req.header("x-forwarded-for") || c.req.header("x-real-ip")
  );

  return c.json({ success: true });
});

export default app;
