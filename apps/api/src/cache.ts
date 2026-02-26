import { createClient, type RedisClientType } from "redis";
import { config } from "./config";

let redis: RedisClientType | null = null;
let connectionAttempted = false;

export const getRedisClient = async (): Promise<RedisClientType | null> => {
  if (!config.redisUrl) {
    return null;
  }

  if (redis) {
    return redis;
  }

  if (connectionAttempted) {
    return null;
  }

  connectionAttempted = true;

  try {
    redis = createClient({
      url: config.redisUrl,
      socket: { connectTimeout: 3000, reconnectStrategy: false },
    });
    await redis.connect();

    return redis;
  } catch (error) {
    console.error("[Cache] Redis connection failed:", error instanceof Error ? error.message : "Unknown");
    redis = null;
    return null;
  }
};

export const CACHE_TTL = {
  session: 60 * 60,
  gitObject: 60 * 60 * 24,
  refs: 60 * 5,
  branches: 60 * 5,
  tree: 60 * 30,
  file: 60 * 60,
  commits: 60 * 10,
} as const;

function cacheKey(type: string, ...parts: string[]): string {
  return `sigmagit:${type}:${parts.join(":")}`;
}

export async function getCached<T>(key: string): Promise<T | null> {
  const client = await getRedisClient();
  if (!client) return null;

  try {
    const data = await client.get(key);
    if (data) {
      return JSON.parse(data) as T;
    }
  } catch {
  }
  return null;
}

export async function setCache<T>(key: string, value: T, ttl: number): Promise<void> {
  const client = await getRedisClient();
  if (!client) return;

  try {
    await client.set(key, JSON.stringify(value), { EX: ttl });
  } catch {
  }
}

export async function deleteCache(key: string): Promise<void> {
  const client = await getRedisClient();
  if (!client) return;

  try {
    await client.del(key);
  } catch {
  }
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  const client = await getRedisClient();
  if (!client) return;

  try {
    let cursor = '0';
    const SCAN_BATCH_SIZE = 100;
    let totalDeleted = 0;

    do {
      const result = await client.scan(cursor, {
        MATCH: pattern,
        COUNT: SCAN_BATCH_SIZE,
      });

      cursor = result.cursor;
      const keys = result.keys;

      if (keys.length > 0) {
        await client.del(keys);
        totalDeleted += keys.length;
      }

      if (cursor === '0') break;

      if (totalDeleted % 1000 === 0) {
        console.log(`[Cache] Deleted ${totalDeleted} keys for pattern ${pattern}`);
      }
    } while (cursor !== '0');

    if (totalDeleted > 0) {
      console.log(`[Cache] Total deleted ${totalDeleted} keys for pattern ${pattern}`);
    }
  } catch (error) {
    console.error('[Cache] Error deleting pattern:', error);
  }
}

export const repoCache = {
  branchesKey: (userId: string, repoName: string) =>
    cacheKey("branches", userId, repoName),

  commitsKey: (userId: string, repoName: string, branch: string, limit: number, skip: number) =>
    cacheKey("commits", userId, repoName, branch, String(limit), String(skip)),

  commitCountKey: (userId: string, repoName: string, branch: string) =>
    cacheKey("commit-count", userId, repoName, branch),

  treeKey: (userId: string, repoName: string, branch: string, path: string) =>
    cacheKey("tree", userId, repoName, branch, path || "root"),

  fileKey: (userId: string, repoName: string, branch: string, path: string) =>
    cacheKey("file", userId, repoName, branch, path),

  refKey: (userId: string, repoName: string, ref: string) =>
    cacheKey("ref", userId, repoName, ref),

  async invalidateRepo(userId: string, repoName: string): Promise<void> {
    await deleteCachePattern(`sigmagit:*:${userId}:${repoName}:*`);
    await deleteCachePattern(`sigmagit:*:${userId}:${repoName}`);

  },

  async invalidateBranch(userId: string, repoName: string, branch: string): Promise<void> {
    await deleteCachePattern(`sigmagit:commits:${userId}:${repoName}:${branch}:*`);
    await deleteCache(repoCache.commitCountKey(userId, repoName, branch));
    await deleteCachePattern(`sigmagit:tree:${userId}:${repoName}:${branch}:*`);
    await deleteCachePattern(`sigmagit:file:${userId}:${repoName}:${branch}:*`);
    await deleteCache(repoCache.refKey(userId, repoName, branch));
    await deleteCache(repoCache.branchesKey(userId, repoName));

  },
};
