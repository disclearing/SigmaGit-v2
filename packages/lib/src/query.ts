const RATE_LIMIT_COOLDOWN_MS = 60_000;
let lastRateLimitTime = 0;

export function isInRateLimitCooldown(): boolean {
  return Date.now() - lastRateLimitTime < RATE_LIMIT_COOLDOWN_MS;
}

export function setRateLimitCooldown(): void {
  lastRateLimitTime = Date.now();
}

export const DEFAULT_QUERY_OPTIONS = {
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 30,
  retry: (failureCount: number, error: Error) => {
    if (error?.message?.includes('Too many requests') || error?.message?.includes('rate limit')) {
      return false;
    }
    return failureCount < 1;
  },
  refetchOnWindowFocus: false,
  refetchInterval: () => {
    if (isInRateLimitCooldown()) {
      return RATE_LIMIT_COOLDOWN_MS;
    }
    return false;
  },
} as const;

export { RATE_LIMIT_COOLDOWN_MS };
