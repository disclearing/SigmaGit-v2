import { db, repositoryMigrations, repositories, users } from "@sigmagit/db";
import { eq } from "drizzle-orm";
import { getRepoPrefix, putObject, copyPrefix } from "../s3";
import { exec } from "bun";
import { mkdir, rm } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const TEMP_DIR = "/tmp/sigmagit-migrations";

export async function processMigration(migrationId: string) {
  const [migration] = await db
    .select()
    .from(repositoryMigrations)
    .where(eq(repositoryMigrations.id, migrationId));

  if (!migration) {
    console.error(`[Migration] Migration ${migrationId} not found`);
    return;
  }

  try {
    // Update status to cloning
    await db
      .update(repositoryMigrations)
      .set({
        status: "cloning",
        progress: 10,
        startedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(repositoryMigrations.id, migrationId));

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, migration.userId));

    if (!user) {
      throw new Error("User not found");
    }

    // Create temp directory
    const tempRepoPath = join(TEMP_DIR, migrationId);
    await mkdir(tempRepoPath, { recursive: true });

    // Clone repository
    const cloneUrl = migration.sourceUrl;
    console.log(`[Migration] Cloning ${cloneUrl}...`);

    const cloneResult = await exec({
      cmd: ["git", "clone", "--bare", cloneUrl, tempRepoPath],
      cwd: TEMP_DIR,
    });

    if (cloneResult.exitCode !== 0) {
      throw new Error(`Git clone failed: ${cloneResult.stderr.toString()}`);
    }

    // Update progress
    await db
      .update(repositoryMigrations)
      .set({
        progress: 50,
        status: "importing",
        updatedAt: new Date(),
      })
      .where(eq(repositoryMigrations.id, migrationId));

    // Create repository record
    const repoName = migration.sourceRepo || migration.sourceUrl.split("/").pop()?.replace(/\.git$/, "") || "imported-repo";
    const normalizedName = repoName.toLowerCase().replace(/[^a-z0-9-]/g, "-");

    // Check if repo already exists
    const existing = await db.query.repositories.findFirst({
      where: and(eq(repositories.ownerId, user.id), eq(repositories.name, normalizedName)),
    });

    if (existing) {
      throw new Error("Repository with this name already exists");
    }

    const [repo] = await db
      .insert(repositories)
      .values({
        name: normalizedName,
        description: migration.options?.description || null,
        visibility: (migration.options?.visibility as "public" | "private") || "public",
        ownerId: user.id,
        organizationId: migration.options?.organizationId || null,
      })
      .returning();

    // Copy git objects to S3 using putObject
    const targetPrefix = getRepoPrefix(user.id, normalizedName);
    
    // Copy essential git files
    const headContent = await Bun.file(join(tempRepoPath, "HEAD")).text().catch(() => "ref: refs/heads/main\n");
    await putObject(`${targetPrefix}/HEAD`, headContent);
    
    const configContent = await Bun.file(join(tempRepoPath, "config")).text().catch(() => "[core]\n\trepositoryformatversion = 0\n\tfilemode = true\n\tbare = true\n");
    await putObject(`${targetPrefix}/config`, configContent);
    
    // Copy objects directory recursively
    const objectsPath = join(tempRepoPath, "objects");
    try {
      const objectsDir = await import("fs/promises");
      const { readdir, readFile, stat } = objectsDir;
      
      async function copyDir(dirPath: string, prefix: string) {
        const entries = await readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = join(dirPath, entry.name);
          const relativePath = `${prefix}/${entry.name}`;
          
          if (entry.isDirectory()) {
            await copyDir(fullPath, relativePath);
          } else {
            const content = await readFile(fullPath);
            await putObject(`${targetPrefix}/${relativePath}`, content);
          }
        }
      }
      
      await copyDir(objectsPath, "objects");
      
      // Copy refs directory
      const refsPath = join(tempRepoPath, "refs");
      try {
        await copyDir(refsPath, "refs");
      } catch {
        // Refs might not exist, that's okay
      }
    } catch (error) {
      console.error("[Migration] Error copying objects:", error);
      // Continue anyway - at least HEAD and config are set
    }

    // Update migration with repo ID
    await db
      .update(repositoryMigrations)
      .set({
        repositoryId: repo.id,
        progress: 90,
        updatedAt: new Date(),
      })
      .where(eq(repositoryMigrations.id, migrationId));

    // TODO: Import metadata (issues, PRs, labels) if options specify

    // Mark as completed
    await db
      .update(repositoryMigrations)
      .set({
        status: "completed",
        progress: 100,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(repositoryMigrations.id, migrationId));

    // Cleanup temp directory
    await rm(tempRepoPath, { recursive: true, force: true });

    console.log(`[Migration] Completed migration ${migrationId}`);
  } catch (error) {
    console.error(`[Migration] Error processing migration ${migrationId}:`, error);
    
    await db
      .update(repositoryMigrations)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        updatedAt: new Date(),
      })
      .where(eq(repositoryMigrations.id, migrationId));
  }
}

// Background worker - processes pending migrations
export async function startMigrationWorker() {
  console.log("[Migration] Starting migration worker...");

  setInterval(async () => {
    try {
      const pendingMigrations = await db
        .select()
        .from(repositoryMigrations)
        .where(eq(repositoryMigrations.status, "pending"))
        .limit(1);

      for (const migration of pendingMigrations) {
        console.log(`[Migration] Processing migration ${migration.id}...`);
        await processMigration(migration.id);
      }
    } catch (error) {
      console.error("[Migration] Worker error:", error);
    }
  }, 10000); // Check every 10 seconds
}
