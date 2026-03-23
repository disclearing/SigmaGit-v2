import { db, repositoryCollaborators } from "@sigmagit/db";
import { eq, and } from "drizzle-orm";

export type AccessUser = { id: string; role?: string } | null | undefined;
export type Repository = { id: string; ownerId: string; visibility: string };

/**
 * Check if a user can access a repository.
 *
 * - Admins always have READ access to all repos
 * - Public repos are readable by anyone
 * - Private repos require owner or collaborator membership
 * - For write operations, admins still need explicit collaborator status
 */
export async function canAccessRepository(
  repo: Repository,
  user: AccessUser,
  writeRequired = false
): Promise<boolean> {
  // Admins always have READ access to everything
  if (user?.role === "admin" && user?.id) {
    // For write operations, admins still need to be owner or write/admin collaborator
    if (!writeRequired) return true;
    if (user.id === repo.ownerId) return true;
    const collab = await db.query.repositoryCollaborators.findFirst({
      where: and(
        eq(repositoryCollaborators.repositoryId, repo.id),
        eq(repositoryCollaborators.userId, user.id)
      ),
    });
    return collab?.permission === "write" || collab?.permission === "admin";
  }

  // Public repos - anyone can read
  if (repo.visibility === "public" && !writeRequired) return true;

  // Need auth for private repos (check both user existence and id)
  if (!user?.id) return false;

  // Owner always has access
  if (user.id === repo.ownerId) return true;

  // Check collaborator status
  const collaborator = await db.query.repositoryCollaborators.findFirst({
    where: and(
      eq(repositoryCollaborators.repositoryId, repo.id),
      eq(repositoryCollaborators.userId, user.id)
    ),
  });

  if (!collaborator) return false;

  if (writeRequired) {
    return collaborator.permission === "write" || collaborator.permission === "admin";
  }

  return true;
}
