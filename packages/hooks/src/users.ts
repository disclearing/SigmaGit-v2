import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useApi } from "./context";

export function useCurrentUserSummary(enabled = true) {
  const api = useApi();
  return useQuery({
    queryKey: ["user", "me", "summary"],
    queryFn: () => api.users.getSummary(),
    enabled,
  });
}

export function usePlatformStats() {
  const api = useApi();
  return useQuery({
    queryKey: ["platform", "stats"],
    queryFn: () => api.users.getPlatformStats(),
    staleTime: 60_000,
    refetchInterval: 120_000,
    refetchIntervalInBackground: false,
  });
}

export function useProfileResolve(username: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["profile", "resolve", username],
    queryFn: () => api.users.resolve(username),
    enabled: !!username,
    staleTime: 30_000, // 30s so repeat visits feel instant
  });
}

export function useUserProfile(username: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["user", username, "profile"],
    queryFn: () => api.users.getProfile(username),
    enabled: !!username,
    staleTime: 30_000, // 30s so repeat visits feel instant
  });
}

export function useProfileCounts(username: string, options?: { enabled?: boolean }) {
  const api = useApi();
  return useQuery({
    queryKey: ["user", username, "profile-counts"],
    queryFn: () => api.users.getProfileCounts(username),
    enabled: options?.enabled ?? !!username,
    staleTime: 30_000,
  });
}

export function useUserStarredRepos(username: string, options?: { enabled?: boolean }) {
  const api = useApi();
  return useQuery({
    queryKey: ["user", username, "starred"],
    queryFn: () => api.users.getStarred(username),
    enabled: options?.enabled ?? !!username,
  });
}

export function useUserAvatarByUsername(username: string | null | undefined) {
  const api = useApi();
  return useQuery({
    queryKey: ["user", username, "avatar"],
    queryFn: () => api.users.getAvatarByUsername(username!),
    enabled: !!username,
    staleTime: 60_000, // 1 min so avatars in lists/profile feel instant
  });
}

export function usePublicUsers(sortBy: "newest" | "oldest" = "newest", limit = 20, offset = 0) {
  const api = useApi();
  return useQuery({
    queryKey: ["users", "public", sortBy, limit, offset],
    queryFn: () => api.users.getPublic(sortBy, limit, offset),
  });
}

export function useInfinitePublicUsers(sortBy: "newest" | "oldest" = "newest", pageSize = 20) {
  const api = useApi();
  return useInfiniteQuery({
    queryKey: ["users", "public", "infinite", sortBy],
    queryFn: ({ pageParam = 0 }) => api.users.getPublic(sortBy, pageSize, pageParam),
    getNextPageParam: (lastPage, allPages) => (lastPage.hasMore ? allPages.length * pageSize : undefined),
    initialPageParam: 0,
  });
}
