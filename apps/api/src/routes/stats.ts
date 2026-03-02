import { db, organizations, repositories, users } from "@sigmagit/db";
import { sql } from "drizzle-orm";
import { Hono } from "hono";

const app = new Hono();

app.get("/api/stats/platform", async (c) => {
  const [userCountRow, publicRepoCountRow, organizationCountRow] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)::int` }).from(users),
    db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(repositories)
      .where(sql`${repositories.visibility} = 'public'`),
    db.select({ count: sql<number>`COUNT(*)::int` }).from(organizations),
  ]);

  return c.json({
    developers: Number(userCountRow[0]?.count ?? 0),
    repositories: Number(publicRepoCountRow[0]?.count ?? 0),
    organizations: Number(organizationCountRow[0]?.count ?? 0),
    uptimeSeconds: Math.floor(process.uptime()),
    generatedAt: new Date().toISOString(),
  });
});

export default app;
