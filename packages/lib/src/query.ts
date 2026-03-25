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
} as const;
