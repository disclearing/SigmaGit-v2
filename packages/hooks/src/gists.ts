import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./context";

export function usePublicGists(limit = 20, offset = 0) {
  const api = useApi();
  return useQuery({
    queryKey: ["gists", "public", limit, offset],
    queryFn: () => api.gists.getPublic(limit, offset),
  });
}

export function useMyGists(options?: { enabled?: boolean }) {
  const api = useApi();
  return useQuery({
    queryKey: ["gists", "mine"],
    queryFn: () => api.gists.list(),
    enabled: options?.enabled ?? true,
  });
}

export function useGist(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["gist", id],
    queryFn: () => api.gists.get(id),
    enabled: !!id,
  });
}

export function useCreateGist() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => api.gists.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gists"] });
    },
  });
}

export function useUpdateGist() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) => api.gists.update(id, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["gist", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["gists"] });
    },
  });
}

export function useDeleteGist() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.gists.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gists"] });
    },
  });
}

export function useToggleGistStar() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.gists.toggleStar(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["gist", id] });
      queryClient.invalidateQueries({ queryKey: ["gist", id, "starred"] });
    },
  });
}

export function useIsGistStarred(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["gist", id, "starred"],
    queryFn: () => api.gists.isStarred(id),
    enabled: !!id,
  });
}

export function useForkGist() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.gists.fork(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gists"] });
    },
  });
}

export function useGistComments(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["gist-comments", id],
    queryFn: () => api.gists.getComments(id),
    enabled: !!id,
  });
}

export function useCreateGistComment() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => api.gists.createComment(id, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["gist-comments", variables.id] });
    },
  });
}

export function useUserGists(username: string, limit = 20, offset = 0) {
  const api = useApi();
  return useQuery({
    queryKey: ["user-gists", username, limit, offset],
    queryFn: () => api.gists.getUserGists(username, limit, offset),
    enabled: !!username,
  });
}
