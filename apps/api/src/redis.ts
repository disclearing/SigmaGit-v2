import { createClient, type RedisClientType } from "redis";
import { config } from "./config";

let redis: RedisClientType | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RECONNECT_DELAY = 1000;

async function isHealthy(client: RedisClientType): Promise<boolean> {
  try {
    await client.ping();
    return true;
  } catch {
    return false;
  }
}

export const getRedis = async (): Promise<RedisClientType | null> => {
  if (!config.redisUrl) {
    return null;
  }

  if (redis && await isHealthy(redis)) {
    reconnectAttempts = 0;
    return redis;
  }

  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error("[Redis] Max reconnection attempts reached, giving up");
    return null;
  }

  const delay = INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts);

  if (reconnectAttempts > 0) {
    console.log(`[Redis] Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}, delay ${delay}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  try {
    const newClient = createClient({
      url: config.redisUrl,
      socket: {
        connectTimeout: 3000,
        reconnectStrategy: false, // handled manually above
      },
    });

    await newClient.connect();

    redis = newClient as any;
    reconnectAttempts = 0;
    console.log("[Redis] Connected successfully");
    return redis;
  } catch (error) {
    reconnectAttempts++;
    console.error(`[Redis] Connection attempt ${reconnectAttempts} failed:`, error instanceof Error ? error.message : "Unknown error");
    redis = null;
    return null;
  }
};

export const initializeRedis = async (): Promise<RedisClientType> => {
  if (!config.redisUrl) {
    throw new Error("REDIS_URL is not configured");
  }

  const client = await getRedis();
  if (!client) {
    throw new Error("Failed to connect to Redis");
  }

  return client;
};
