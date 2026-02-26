import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./context";

export function useMigrations(includeDrafts = false) {
  const api = useApi();
  return useQuery({
    queryKey: ["migrations", "mine"],
    queryFn: () => api.migrations?.list() ?? Promise.resolve({ migrations: [], hasMore: false }),
    enabled: includeDrafts,
  });
}

export function useMigration(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["migration", id],
    queryFn: () => api.migrations?.get?.(id) ?? Promise.resolve(undefined),
    enabled: !!id,
  });
}

export function useCreateMigration() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: unknown) => api.migrations?.create?.(data) ?? Promise.resolve(undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["migrations"] });
    },
  });
}

export function useCancelMigration() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.migrations?.cancel?.(id) ?? Promise.resolve({ success: false }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["migration", variables] });
      queryClient.invalidateQueries({ queryKey: ["migrations"] });
    },
  });
}

export function useDeleteMigration() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.migrations?.delete?.(id) ?? Promise.resolve({ success: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["migrations"] });
    },
  });
}
