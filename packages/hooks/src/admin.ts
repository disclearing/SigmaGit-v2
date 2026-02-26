import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useApi } from "./context";

export function useAdminStats() {
  const api = useApi();
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => api.admin.getStats(),
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
  return useQuery({
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
