import { createMiddleware } from 'hono/factory';
import {
  RateLimiterRedis,
  RateLimiterMemory,
  RateLimiterAbstract,
  RateLimiterRes,
} from 'rate-limiter-flexible';
import { getRedis } from '../redis';

type RateLimitTier = 'general' | 'auth' | 'write' | 'api-key';

interface RateLimitConfig {
  keyPrefix: string;
  points: number;
  duration: number;
  blockDuration?: number;
}

const RATE_LIMIT_CONFIGS: Record<RateLimitTier, RateLimitConfig> = {
  general: {
    keyPrefix: 'rl_general',
    points: 60,
    duration: 60,
    blockDuration: 300,
  },
  auth: {
    keyPrefix: 'rl_auth',
    points: 10,
    duration: 60,
    blockDuration: 1800,
  },
  write: {
    keyPrefix: 'rl_write',
    points: 30,
    duration: 60,
    blockDuration: 3600,
  },
  'api-key': {
    keyPrefix: 'rl_apikey',
    points: 500,
    duration: 60,
    blockDuration: 3600,
  },
};

const limiters = new Map<string, RateLimiterAbstract>();

async function getLimiter(tier: RateLimitTier): Promise<RateLimiterAbstract> {
  const existing = limiters.get(tier);
  if (existing) return existing;

  const config = RATE_LIMIT_CONFIGS[tier];
  const redis = await getRedis();

  let limiter: RateLimiterAbstract;

  if (redis) {
    limiter = new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: config.keyPrefix,
      points: config.points,
      duration: config.duration,
      blockDuration: config.blockDuration,
      useRedisPackage: true,
    });
  } else {
    limiter = new RateLimiterMemory({
      keyPrefix: config.keyPrefix,
      points: config.points,
      duration: config.duration,
      blockDuration: config.blockDuration,
    });
  }

  limiters.set(tier, limiter);
  return limiter;
}

function getClientIp(c: any): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    c.req.header('cf-connecting-ip') ||
    'unknown'
  );
}

function setRateLimitHeaders(
  c: any,
  res: RateLimiterRes,
  config: RateLimitConfig
) {
  c.header('RateLimit-Limit', String(config.points));
  c.header('RateLimit-Remaining', String(Math.max(0, res.remainingPoints)));
  c.header(
    'RateLimit-Reset',
    String(Math.ceil(res.msBeforeNext / 1000))
  );
  c.header('RateLimit-Policy', `${config.points};w=${config.duration}`);
}

function createRateLimiter(tier: RateLimitTier) {
  return createMiddleware(async (c, next) => {
    const limiter = await getLimiter(tier);
    const config = RATE_LIMIT_CONFIGS[tier];
    const key = getClientIp(c);

    try {
      const res = await limiter.consume(key);
      setRateLimitHeaders(c, res, config);
      await next();
    } catch (err) {
      if (err instanceof RateLimiterRes) {
        setRateLimitHeaders(c, err, config);
        const retryAfter = Math.ceil(err.msBeforeNext / 1000);
        c.header('Retry-After', String(retryAfter));
        return c.json(
          {
            error: 'Too many requests',
            retryAfter,
          },
          429
        );
      }
      console.error('[RateLimit] Limiter error:', err);
      await next();
    }
  });
}

function createApiKeyRateLimiter() {
  return createMiddleware(async (c, next) => {
    const apiKey = c.req.header('x-api-key');
    if (!apiKey) {
      await next();
      return;
    }

    const limiter = await getLimiter('api-key');
    const config = RATE_LIMIT_CONFIGS['api-key'];

    try {
      const res = await limiter.consume(`apikey:${apiKey}`);
      setRateLimitHeaders(c, res, config);
      await next();
    } catch (err) {
      if (err instanceof RateLimiterRes) {
        setRateLimitHeaders(c, err, config);
        const retryAfter = Math.ceil(err.msBeforeNext / 1000);
        c.header('Retry-After', String(retryAfter));
        return c.json(
          {
            error: 'API key rate limit exceeded',
            retryAfter,
          },
          429
        );
      }
      console.error('[RateLimit] API key limiter error:', err);
      await next();
    }
  });
}

export const generalRateLimit = createRateLimiter('general');
export const authRateLimit = createRateLimiter('auth');
export const writeRateLimit = createRateLimiter('write');
export const apiKeyRateLimit = createApiKeyRateLimiter();

const unauthenticatedLimiter = new Map<string, { count: number; resetAt: number }>();
const UNAUTH_LIMIT = 15;
const UNAUTH_WINDOW = 60_000;
const UNAUTH_BLOCK = 7_200_000;
const unauthBlocked = new Map<string, number>();

function hasSessionCookie(c: any): boolean {
  const cookieHeader = c.req.header('cookie');
  if (!cookieHeader) return false;
  return cookieHeader.includes('sigmagit');
}

export function unauthenticatedRateLimit() {
  return createMiddleware(async (c, next) => {
    const path = c.req.path;

    if (path.startsWith('/api/auth/')) {
      await next();
      return;
    }

    if (c.req.header('x-api-key') || hasSessionCookie(c)) {
      await next();
      return;
    }

    const key = getClientIp(c);
    const now = Date.now();

    const blockExpiry = unauthBlocked.get(key);
    if (blockExpiry && blockExpiry > now) {
      const retryAfter = Math.ceil((blockExpiry - now) / 1000);
      c.header('Retry-After', String(retryAfter));
      return c.json({ error: 'Too many requests', retryAfter }, 429);
    }
    if (blockExpiry) {
      unauthBlocked.delete(key);
    }

    let entry = unauthenticatedLimiter.get(key);
    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + UNAUTH_WINDOW };
      unauthenticatedLimiter.set(key, entry);
    }

    entry.count++;
    if (entry.count > UNAUTH_LIMIT) {
      unauthBlocked.set(key, now + UNAUTH_BLOCK);
      unauthenticatedLimiter.delete(key);
      c.header('Retry-After', String(UNAUTH_BLOCK / 1000));
      return c.json({ error: 'Too many unauthenticated requests', retryAfter: UNAUTH_BLOCK / 1000 }, 429);
    }

    await next();
  });
}

let activeRequests = 0;
const MAX_CONCURRENT = 50;

export function concurrencyLimiter() {
  return createMiddleware(async (c, next) => {
    if (activeRequests >= MAX_CONCURRENT) {
      return c.json({ error: 'Server busy, try again later', retryAfter: 5 }, 503);
    }
    activeRequests++;
    try {
      await next();
    } finally {
      activeRequests--;
    }
  });
}
