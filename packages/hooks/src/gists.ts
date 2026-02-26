import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./context";

export function useGists(includeDrafts = false) {
  const api = useApi();
  return useQuery({
    queryKey: ["gists", "mine"],
    queryFn: () => api.gists?.list() ?? Promise.resolve({ gists: [], hasMore: false }),
    enabled: includeDrafts,
  });
}

export function usePublicGists(limit = 20, offset = 0) {
  const api = useApi();
  return useQuery({
    queryKey: ["gists", "public", limit, offset],
    queryFn: () => api.gists?.getPublic?.(limit, offset) ?? Promise.resolve({ gists: [], hasMore: false }),
  });
}

export function useGist(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["gist", id],
    queryFn: () => api.gists?.get?.(id) ?? Promise.resolve(undefined),
    enabled: !!id,
  });
}

export function useCreateGist() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: unknown) => api.gists?.create?.(body) ?? Promise.resolve(undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gists"] });
    },
  });
}

export function useUpdateGist() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) =>
      api.gists?.update?.(id, body) ?? Promise.resolve(undefined),
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
    mutationFn: (id: string) => api.gists?.delete?.(id) ?? Promise.resolve({ success: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gists"] });
    },
  });
}

export function useGistRevisions(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["gist-revisions", id],
    queryFn: () => api.gists?.getRevisions?.(id) ?? Promise.resolve({ revisions: [] }),
    enabled: !!id,
  });
}

export function useToggleGistStar() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.gists?.toggleStar?.(id) ?? Promise.resolve({ starred: false }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["gist", variables] });
    },
  });
}

export function useIsGistStarred(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["gist", id, "starred"],
    queryFn: () => api.gists?.isStarred?.(id) ?? Promise.resolve({ starred: false }),
    enabled: !!id,
  });
}

export function useForkGist() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.gists?.fork?.(id) ?? Promise.resolve({ id: "" }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["gists"] });
      queryClient.invalidateQueries({ queryKey: ["gist", variables] });
    },
  });
}

export function useGistForks(id: string, limit = 20, offset = 0) {
  const api = useApi();
  return useQuery({
    queryKey: ["gist-forks", id, limit, offset],
    queryFn: () => api.gists?.getForks?.(id, limit, offset) ?? Promise.resolve({ forks: [], hasMore: false }),
    enabled: !!id,
  });
}

export function useGistComments(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["gist-comments", id],
    queryFn: () => api.gists?.getComments?.(id) ?? Promise.resolve({ comments: [] }),
    enabled: !!id,
  });
}

export function useCreateGistComment() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      api.gists?.createComment?.(id, body) ?? Promise.resolve(undefined),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["gist-comments", variables.id] });
    },
  });
}

export function useUserGists(username: string, limit = 20, offset = 0) {
  const api = useApi();
  return useQuery({
    queryKey: ["user-gists", username, limit, offset],
    queryFn: () => api.gists?.getUserGists?.(username, limit, offset) ?? Promise.resolve({ gists: [], hasMore: false }),
    enabled: !!username,
  });
}
