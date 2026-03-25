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
  duration: number; // seconds
  blockDuration?: number; // seconds, for brute force protection
}

const RATE_LIMIT_CONFIGS: Record<RateLimitTier, RateLimitConfig> = {
  general: {
    keyPrefix: 'rl_general',
    points: 120,
    duration: 60,
  },
  auth: {
    keyPrefix: 'rl_auth',
    points: 10,
    duration: 60,
    blockDuration: 300, // 5 min block after exhausting attempts
  },
  write: {
    keyPrefix: 'rl_write',
    points: 60,
    duration: 60,
  },
  'api-key': {
    keyPrefix: 'rl_apikey',
    points: 1000,
    duration: 60,
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
      // If rate limiter fails (e.g. Redis down), allow the request through
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
