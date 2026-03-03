import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useApi } from "./context";
import type { AdminRepository } from "./types";

export function useAdminStats() {
  const api = useApi();
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => api.admin.getStats(),
  });
}

export function useAdminSystemStats() {
  const api = useApi();
  return useQuery({
    queryKey: ["admin", "system-stats"],
    queryFn: () => api.admin.getSystemStats(),
    refetchInterval: 30_000, // refresh every 30s for uptime
  });
}

export function useAdminUtilsPreview() {
  const api = useApi();
  return useQuery({
    queryKey: ["admin", "utils-preview"],
    queryFn: () => api.admin.getUtilsPreview(),
  });
}

export function useCleanupEmptyRepos() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.admin.cleanupEmptyRepos(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "utils-preview"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}

export function useCleanupUnactivatedAccounts() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.admin.cleanupUnactivatedAccounts(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "utils-preview"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}

export function useCleanupExpiredSessions() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.admin.cleanupExpiredSessions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "utils-preview"] });
    },
  });
}

export function useCleanupExpiredVerifications() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.admin.cleanupExpiredVerifications(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "utils-preview"] });
    },
  });
}

export function useAdminUsers(search = "", role?: string, limit = 20, offset = 0) {
  const api = useApi();
  return useQuery({
    queryKey: ["admin", "users", search, role, limit, offset],
    queryFn: () => api.admin.getUsers(search, role, limit, offset),
  });
}

export function useAdminUser(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["admin", "user", id],
    queryFn: () => api.admin.getUser(id),
    enabled: !!id,
  });
}

export function useUpdateAdminUser() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { role?: string } }) =>
      api.admin.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "user"] });
    },
  });
}

export function useDeleteAdminUser() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.admin.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useAdminRepositories(search = "", visibility?: string, limit = 20, offset = 0) {
  const api = useApi();
  return useQuery<{ repositories: AdminRepository[]; hasMore: boolean }>({
    queryKey: ["admin", "repositories", search, visibility, limit, offset],
    queryFn: () => api.admin.getRepositories(search, visibility, limit, offset),
  });
}

export function useDeleteAdminRepository() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.admin.deleteRepository(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "repositories"] });
    },
  });
}

export function useTransferAdminRepository() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newOwnerId }: { id: string; newOwnerId: string }) =>
      api.admin.transferRepository(id, newOwnerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "repositories"] });
    },
  });
}

export function useAdminAuditLogs(action?: string, targetType?: string, limit = 50, offset = 0) {
  const api = useApi();
  return useQuery({
    queryKey: ["admin", "audit-logs", action, targetType, limit, offset],
    queryFn: () => api.admin.getAuditLogs(action, targetType, limit, offset),
  });
}

export function useAdminSettings() {
  const api = useApi();
  return useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => api.admin.getSettings(),
  });
}

export function useUpdateAdminSettings() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Record<string, unknown>) => api.admin.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
  });
}

export function useToggleMaintenance() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (enabled: boolean) => api.admin.toggleMaintenance(enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
  });
}

export function useAdminOrganizations(search = "", limit = 20, offset = 0) {
  const api = useApi();
  return useQuery({
    queryKey: ["admin", "organizations", search, limit, offset],
    queryFn: () => api.admin.getOrganizations(search, limit, offset),
  });
}

export function useAdminOrganization(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["admin", "organization", id],
    queryFn: () => api.admin.getOrganization(id),
    enabled: !!id,
  });
}

export function useDeleteAdminOrganization() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.admin.deleteOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "organizations"] });
    },
  });
}

export function useAdminIssues(search = "", state?: string, limit = 20, offset = 0) {
  const api = useApi();
  return useQuery({
    queryKey: ["admin", "issues", search, state, limit, offset],
    queryFn: () => api.admin.getIssues(search, state, limit, offset),
  });
}

export function useAdminAnalytics(days = 30) {
  const api = useApi();
  return useQuery({
    queryKey: ["admin", "analytics", days],
    queryFn: () => api.admin.getAnalytics(days),
  });
}

export function useAdminGists(search = "", visibility?: string, limit = 20, offset = 0) {
  const api = useApi();
  return useQuery({
    queryKey: ["admin", "gists", search, visibility, limit, offset],
    queryFn: () => api.admin.getGists(search, visibility, limit, offset),
  });
}

export function useDeleteAdminGist() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.admin.deleteGist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "gists"] });
    },
  });
}
