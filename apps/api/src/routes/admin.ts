import { Hono } from "hono";
import { db, users, repositories, auditLogs, systemSettings, organizations, issues, pullRequests, gists, gistFiles } from "@sigmagit/db";
import { eq, sql, desc, count, and, or, ilike, gte, lte, inArray } from "drizzle-orm";
import { authMiddleware, requireAuth, requireAdmin, type AuthVariables } from "../middleware/auth";
import { repoCache } from "../cache";
import { deletePrefix, getRepoPrefix } from "../s3";

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

async function cleanupRepositoryStorage(
  repository: Pick<typeof repositories.$inferSelect, "name" | "ownerId" | "organizationId">
) {
  const prefixes = new Set<string>();
  prefixes.add(getRepoPrefix(repository.ownerId, repository.name));
  if (repository.organizationId) {
    prefixes.add(getRepoPrefix(repository.organizationId, repository.name));
  }

  await Promise.all(
    Array.from(prefixes).map(async (prefix) => {
      try {
        await deletePrefix(prefix);
      } catch (error) {
        console.error(`[Admin] Failed to delete repository storage prefix "${prefix}":`, error);
      }
    })
  );
}

async function invalidateRepositoryCaches(
  repository: Pick<typeof repositories.$inferSelect, "name" | "ownerId" | "organizationId">
) {
  const ownerNames = new Set<string>();

  const owner = await db.query.users.findFirst({
    where: eq(users.id, repository.ownerId),
    columns: { username: true },
  });

  if (owner?.username) {
    ownerNames.add(owner.username);
  }

  if (repository.organizationId) {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, repository.organizationId),
      columns: { name: true },
    });
    if (org?.name) {
      ownerNames.add(org.name);
    }
  }

  await Promise.all(
    Array.from(ownerNames).map((ownerName) => repoCache.invalidateRepo(ownerName, repository.name))
  );
}

async function deleteRepositoryCompletely(
  repository: Pick<typeof repositories.$inferSelect, "id" | "name" | "ownerId" | "organizationId">
) {
  // PR rows may reference this repository via head/base repo IDs without ON DELETE CASCADE.
  await db
    .delete(pullRequests)
    .where(or(eq(pullRequests.headRepoId, repository.id), eq(pullRequests.baseRepoId, repository.id)));

  await cleanupRepositoryStorage(repository);
  await invalidateRepositoryCaches(repository);
  await db.delete(repositories).where(eq(repositories.id, repository.id));
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
  const [orgCount] = await db.select({ count: count() }).from(organizations);
  const [issueCount] = await db.select({ count: count() }).from(issues);
  const [openIssueCount] = await db
    .select({ count: count() })
    .from(issues)
    .where(eq(issues.state, "open"));
  const [prCount] = await db.select({ count: count() }).from(pullRequests);
  const [openPrCount] = await db
    .select({ count: count() })
    .from(pullRequests)
    .where(eq(pullRequests.state, "open"));
  const [gistCount] = await db.select({ count: count() }).from(gists);

  // Get recent activity (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [recentUsers] = await db
    .select({ count: count() })
    .from(users)
    .where(gte(users.createdAt, thirtyDaysAgo));
  const [recentRepos] = await db
    .select({ count: count() })
    .from(repositories)
    .where(gte(repositories.createdAt, thirtyDaysAgo));

  return c.json({
    userCount: Number(userCount.count),
    repoCount: Number(repoCount.count),
    publicRepoCount: Number(publicRepoCount.count),
    privateRepoCount: Number(privateRepoCount.count),
    adminCount: Number(adminCount.count),
    moderatorCount: Number(moderatorCount.count),
    orgCount: Number(orgCount.count),
    issueCount: Number(issueCount.count),
    openIssueCount: Number(openIssueCount.count),
    prCount: Number(prCount.count),
    openPrCount: Number(openPrCount.count),
    gistCount: Number(gistCount.count),
    recentUsers: Number(recentUsers.count),
    recentRepos: Number(recentRepos.count),
  });
});

// System stats: uptime, PostgreSQL health and metrics (admin only)
app.get("/api/admin/system-stats", async (c) => {
  const appUptimeSeconds = Math.floor(process.uptime());
  const apiUptimeSeconds = appUptimeSeconds; // API runs in same process

  let postgres: {
    version: string | null;
    connections: number | null;
    databaseSizeBytes: number | null;
    cacheHitRatio: number | null;
    transactionsCommitted: number | null;
    transactionsRolledBack: number | null;
    rowsReturned: number | null;
    rowsFetched: number | null;
    rowsInserted: number | null;
    rowsUpdated: number | null;
    rowsDeleted: number | null;
    error: string | null;
  } = {
    version: null,
    connections: null,
    databaseSizeBytes: null,
    cacheHitRatio: null,
    transactionsCommitted: null,
    transactionsRolledBack: null,
    rowsReturned: null,
    rowsFetched: null,
    rowsInserted: null,
    rowsUpdated: null,
    rowsDeleted: null,
    error: null,
  };

  function firstRow<T extends Record<string, unknown>>(result: unknown): T | null {
    if (Array.isArray(result) && result.length > 0) return result[0] as T;
    const r = result as { rows?: unknown[] };
    if (r?.rows?.length) return r.rows[0] as T;
    return null;
  }

  try {
    const [versionRow, sizeRow, statsRow, connectionsRow] = await Promise.all([
      db.execute(sql`SELECT version() as version`),
      db.execute(sql`SELECT pg_database_size(current_database())::bigint as size`),
      db.execute(
        sql`SELECT xact_commit, xact_rollback, blks_read, blks_hit, tup_returned, tup_fetched, tup_inserted, tup_updated, tup_deleted FROM pg_stat_database WHERE datname = current_database()`
      ),
      db.execute(sql`SELECT count(*)::int as count FROM pg_stat_activity WHERE datname = current_database()`),
    ]);

    const v = firstRow<{ version: string }>(versionRow);
    const sz = firstRow<{ size: string }>(sizeRow);
    const st = firstRow<{
      xact_commit: string;
      xact_rollback: string;
      blks_read: string;
      blks_hit: string;
      tup_returned: string;
      tup_fetched: string;
      tup_inserted: string;
      tup_updated: string;
      tup_deleted: string;
    }>(statsRow);
    const conn = firstRow<{ count: number | string }>(connectionsRow);

    const blksHit = st ? Number(st.blks_hit) || 0 : 0;
    const blksRead = st ? Number(st.blks_read) || 0 : 0;
    const cacheHitRatio =
      blksHit + blksRead > 0 ? Math.round((blksHit / (blksHit + blksRead)) * 10000) / 100 : null;

    postgres = {
      version: v?.version ?? null,
      connections: conn?.count != null ? Number(conn.count) : null,
      databaseSizeBytes: sz != null ? Number(sz.size) : null,
      cacheHitRatio,
      transactionsCommitted: st ? Number(st.xact_commit) : null,
      transactionsRolledBack: st ? Number(st.xact_rollback) : null,
      rowsReturned: st ? Number(st.tup_returned) : null,
      rowsFetched: st ? Number(st.tup_fetched) : null,
      rowsInserted: st ? Number(st.tup_inserted) : null,
      rowsUpdated: st ? Number(st.tup_updated) : null,
      rowsDeleted: st ? Number(st.tup_deleted) : null,
      error: null,
    };
  } catch (err) {
    postgres.error = err instanceof Error ? err.message : "Unknown error";
  }

  return c.json({
    appUptimeSeconds,
    apiUptimeSeconds,
    postgres,
    generatedAt: new Date().toISOString(),
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

  if (actor.id === id) {
    return c.json({ error: "You cannot delete your own account from admin panel" }, 400);
  }

  if (existingUser.role === "admin") {
    const [adminUsers] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "admin"));

    if (Number(adminUsers.count) <= 1) {
      return c.json({ error: "Cannot delete the last admin user" }, 400);
    }
  }

  // Remove non-cascading references to this user before deleting.
  await db.update(issues).set({ closedById: null }).where(eq(issues.closedById, id));
  await db
    .update(pullRequests)
    .set({ mergedById: null, closedById: null })
    .where(or(eq(pullRequests.mergedById, id), eq(pullRequests.closedById, id)));

  // Delete owned repositories explicitly so their git storage is cleaned up.
  const userRepos = await db.query.repositories.findMany({
    where: eq(repositories.ownerId, id),
    columns: { id: true, name: true, ownerId: true, organizationId: true },
  });
  for (const repository of userRepos) {
    await deleteRepositoryCompletely(repository);
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
    .select({
      id: repositories.id,
      name: repositories.name,
      description: repositories.description,
      ownerId: repositories.ownerId,
      organizationId: repositories.organizationId,
      visibility: repositories.visibility,
      createdAt: repositories.createdAt,
      updatedAt: repositories.updatedAt,
      ownerUsername: users.username,
      ownerName: users.name,
      orgName: organizations.name,
      orgDisplayName: organizations.displayName,
    })
    .from(repositories)
    .innerJoin(users, eq(users.id, repositories.ownerId))
    .leftJoin(organizations, eq(organizations.id, repositories.organizationId))
    .where(whereClause)
    .orderBy(desc(repositories.createdAt))
    .limit(limit + 1)
    .offset(offset);

  const hasMore = reposResult.length > limit;
  const reposData = reposResult.slice(0, limit).map((row) => {
    const ownerUsername =
      row.organizationId && row.orgName
        ? row.orgName
        : (row.ownerUsername ?? row.ownerId);
    const ownerDisplayName =
      row.organizationId && (row.orgDisplayName || row.orgName)
        ? (row.orgDisplayName ?? row.orgName)!
        : (row.ownerName || (row.ownerUsername ?? row.ownerId));
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      ownerId: row.ownerId,
      organizationId: row.organizationId,
      visibility: row.visibility,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      ownerUsername,
      ownerDisplayName,
    };
  });

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

  await deleteRepositoryCompletely(existingRepo);

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

app.get("/api/admin/gists", async (c) => {
  const search = c.req.query("search") || "";
  const visibility = c.req.query("visibility");
  const limit = parseInt(c.req.query("limit") || "20", 10);
  const offset = parseInt(c.req.query("offset") || "0", 10);

  const conditions = [];

  if (search) {
    conditions.push(
      or(
        ilike(gists.description, `%${search}%`),
        sql`EXISTS (
          SELECT 1 FROM ${gistFiles} 
          WHERE ${gistFiles.gistId} = ${gists.id} 
          AND ${ilike(gistFiles.filename, `%${search}%`)}
        )`
      )
    );
  }

  if (visibility) {
    conditions.push(eq(gists.visibility, visibility as "public" | "secret"));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const gistsResult = await db
    .select()
    .from(gists)
    .where(whereClause)
    .orderBy(desc(gists.createdAt))
    .limit(limit + 1)
    .offset(offset);

  const hasMore = gistsResult.length > limit;
  const gistsData = gistsResult.slice(0, limit);
  const gistIds = gistsData.map((g) => g.id);

  // Get all files for all gists in one query (without content to save memory)
  const allFiles = gistIds.length > 0
    ? await db
        .select({
          id: gistFiles.id,
          gistId: gistFiles.gistId,
          filename: gistFiles.filename,
          language: gistFiles.language,
          size: gistFiles.size,
          createdAt: gistFiles.createdAt,
          updatedAt: gistFiles.updatedAt,
          // Exclude content field to save memory - admin list doesn't need it
        })
        .from(gistFiles)
        .where(inArray(gistFiles.gistId, gistIds))
    : [];

  // Get all owners in one query
  const ownerIds = [...new Set(gistsData.map((g) => g.ownerId))];
  const allOwners = ownerIds.length > 0
    ? await db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
        })
        .from(users)
        .where(inArray(users.id, ownerIds))
    : [];

  // Group files by gistId
  const filesByGistId = new Map<string, typeof allFiles>();
  for (const file of allFiles) {
    if (!filesByGistId.has(file.gistId)) {
      filesByGistId.set(file.gistId, []);
    }
    filesByGistId.get(file.gistId)!.push(file);
  }

  // Create owner lookup
  const ownerMap = new Map(allOwners.map((o) => [o.id, o]));

  // Combine data
  const gistsWithFiles = gistsData.map((gist) => ({
    ...gist,
    files: filesByGistId.get(gist.id) || [],
    owner: ownerMap.get(gist.ownerId) || null,
  }));

  return c.json({
    gists: gistsWithFiles,
    hasMore,
  });
});

app.delete("/api/admin/gists/:id", async (c) => {
  const id = c.req.param("id");
  const actor = c.get("user")!;

  const existingGist = await db.query.gists.findFirst({
    where: eq(gists.id, id),
  });

  if (!existingGist) {
    return c.json({ error: "Gist not found" }, 404);
  }

  await db.delete(gists).where(eq(gists.id, id));

  await logAuditEvent(
    actor.id,
    "gist.delete",
    "gist",
    id,
    { description: existingGist.description },
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

app.get("/api/admin/organizations", async (c) => {
  const search = c.req.query("search") || "";
  const limit = parseInt(c.req.query("limit") || "20", 10);
  const offset = parseInt(c.req.query("offset") || "0", 10);

  const conditions = [];

  if (search) {
    conditions.push(
      or(
        ilike(organizations.name, `%${search}%`),
        ilike(organizations.displayName, `%${search}%`),
        ilike(organizations.description, `%${search}%`)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const orgsResult = await db
    .select()
    .from(organizations)
    .where(whereClause)
    .orderBy(desc(organizations.createdAt))
    .limit(limit + 1)
    .offset(offset);

  const hasMore = orgsResult.length > limit;
  const orgsData = orgsResult.slice(0, limit);

  return c.json({
    organizations: orgsData,
    hasMore,
  });
});

app.get("/api/admin/organizations/:id", async (c) => {
  const id = c.req.param("id");

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, id),
  });

  if (!org) {
    return c.json({ error: "Organization not found" }, 404);
  }

  const [repoCount] = await db
    .select({ count: count() })
    .from(repositories)
    .where(eq(repositories.organizationId, id));

  return c.json({
    ...org,
    repoCount: Number(repoCount.count),
  });
});

app.delete("/api/admin/organizations/:id", async (c) => {
  const id = c.req.param("id");
  const actor = c.get("user")!;

  const existingOrg = await db.query.organizations.findFirst({
    where: eq(organizations.id, id),
  });

  if (!existingOrg) {
    return c.json({ error: "Organization not found" }, 404);
  }

  // Delete organization repositories explicitly so git storage and cache are cleaned up.
  const organizationRepos = await db.query.repositories.findMany({
    where: eq(repositories.organizationId, id),
    columns: { id: true, name: true, ownerId: true, organizationId: true },
  });

  for (const repository of organizationRepos) {
    await deleteRepositoryCompletely(repository);
  }

  await db.delete(organizations).where(eq(organizations.id, id));

  await logAuditEvent(
    actor.id,
    "org.delete",
    "organization",
    id,
    { name: existingOrg.name },
    c.req.header("x-forwarded-for") || c.req.header("x-real-ip")
  );

  return c.json({ success: true });
});

app.get("/api/admin/issues", async (c) => {
  const search = c.req.query("search") || "";
  const state = c.req.query("state");
  const limit = parseInt(c.req.query("limit") || "20", 10);
  const offset = parseInt(c.req.query("offset") || "0", 10);

  const conditions = [];

  if (search) {
    conditions.push(
      or(ilike(issues.title, `%${search}%`), ilike(issues.body, `%${search}%`))
    );
  }

  if (state) {
    conditions.push(eq(issues.state, state as "open" | "closed"));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const issuesResult = await db
    .select()
    .from(issues)
    .where(whereClause)
    .orderBy(desc(issues.createdAt))
    .limit(limit + 1)
    .offset(offset);

  const hasMore = issuesResult.length > limit;
  const issuesData = issuesResult.slice(0, limit);

  return c.json({
    issues: issuesData,
    hasMore,
  });
});

app.get("/api/admin/analytics", async (c) => {
  const days = parseInt(c.req.query("days") || "30", 10);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // User growth over time
  const userGrowth = await db
    .select({
      date: sql<string>`DATE(${users.createdAt})`,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(users)
    .where(gte(users.createdAt, startDate))
    .groupBy(sql`DATE(${users.createdAt})`)
    .orderBy(sql`DATE(${users.createdAt})`);

  // Repository growth over time
  const repoGrowth = await db
    .select({
      date: sql<string>`DATE(${repositories.createdAt})`,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(repositories)
    .where(gte(repositories.createdAt, startDate))
    .groupBy(sql`DATE(${repositories.createdAt})`)
    .orderBy(sql`DATE(${repositories.createdAt})`);

  // Activity by day
  const activityByDay = await db
    .select({
      date: sql<string>`DATE(${auditLogs.createdAt})`,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(auditLogs)
    .where(gte(auditLogs.createdAt, startDate))
    .groupBy(sql`DATE(${auditLogs.createdAt})`)
    .orderBy(sql`DATE(${auditLogs.createdAt})`);

  return c.json({
    userGrowth,
    repoGrowth,
    activityByDay,
  });
});

export default app;
