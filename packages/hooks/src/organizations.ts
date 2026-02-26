import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./context";

export function useOrganizations(includeDrafts = false) {
  const api = useApi();
  return useQuery({
    queryKey: ["organizations", "mine"],
    queryFn: () => api.organizations?.list?.() ?? Promise.resolve({ organizations: [], hasMore: false }),
    enabled: includeDrafts,
  });
}

export function useOrganization(org: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["organization", org],
    queryFn: () => api.organizations?.get?.(org) ?? Promise.resolve(undefined),
    enabled: !!org,
  });
}

export function useOrganizationMembers(org: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["organization", org, "members"],
    queryFn: () => api.organizations?.getMembers?.(org) ?? Promise.resolve({ members: [] }),
    enabled: !!org,
  });
}

export function useOrganizationTeams(org: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["organization", org, "teams"],
    queryFn: () => api.organizations?.getTeams?.(org) ?? Promise.resolve({ teams: [] }),
    enabled: !!org,
  });
}

export function useOrganizationRepos(org: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["organization", org, "repos"],
    queryFn: () => api.organizations?.getRepositories?.(org) ?? Promise.resolve({ repositories: [] }),
    enabled: !!org,
  });
}

export function useOrganizationInvitations(org: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["organization", org, "invitations"],
    queryFn: () => api.organizations?.getInvitations?.(org) ?? Promise.resolve({ invitations: [] }),
    enabled: !!org,
  });
}

export function useCreateOrganization() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: unknown) => api.organizations?.create?.(data) ?? Promise.resolve(undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}

export function useUpdateOrganization(org: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: unknown) => api.organizations?.update?.(org, data) ?? Promise.resolve(undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", org] });
    },
  });
}

export function useDeleteOrganization(org: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.organizations?.delete?.(org) ?? Promise.resolve({ success: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["repositories", org, "*"] });
    },
  });
}

export function useUpdateOrgMember(org: string, username: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: unknown) => api.organizations?.updateMember?.(org, username, data) ?? Promise.resolve(undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", org, "members"] });
      queryClient.invalidateQueries({ queryKey: ["repositories", org, username, "*"] });
    },
  });
}

export function useRemoveOrgMember(org: string, username: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.organizations?.removeMember?.(org, username) ?? Promise.resolve({ success: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", org, "members"] });
      queryClient.invalidateQueries({ queryKey: ["repositories", org, username, "*"] });
    },
  });
}

export function useCreateTeam(org: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: unknown) => api.organizations?.createTeam?.(org, data) ?? Promise.resolve(undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", org, "teams"] });
    },
  });
}

export function useDeleteTeam(org: string, team: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.organizations?.deleteTeam?.(org, team) ?? Promise.resolve({ success: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", org, "teams", team] });
    },
  });
}

export function useTeam(org: string, team: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["organization", org, "team", team],
    queryFn: () => api.organizations?.getTeam?.(org, team) ?? Promise.resolve(undefined),
    enabled: !!org && !!team,
  });
}

export function useAddTeamMember(org: string, team: string, data: unknown) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.organizations?.addTeamMember?.(org, team, data) ?? Promise.resolve(undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", org, "team", team] });
    },
  });
}

export function useRemoveTeamMember(org: string, team: string, username: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.organizations?.removeTeamMember?.(org, team, username) ?? Promise.resolve({ success: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", org, "team", team] });
      queryClient.invalidateQueries({ queryKey: ["organization", org, "members"] });
    },
  });
}

export function useAddTeamRepo(org: string, team: string, repo: string, data: unknown) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.organizations?.addTeamRepo?.(org, team, repo, data) ?? Promise.resolve(undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", org, "team", "team", "repo"] });
      queryClient.invalidateQueries({ queryKey: ["repositories", org, repo, "*"] });
    },
  });
}

export function useRemoveTeamRepo(org: string, team: string, repo: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.organizations?.removeTeamRepo?.(org, team, repo) ?? Promise.resolve({ success: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repositories", org, repo, "team", "*"] });
    },
  });
}

export function useDeleteTeamRepo(org: string, team: string, repo: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.organizations?.deleteTeamRepo?.(org, team, repo) ?? Promise.resolve({ success: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repositories", org, repo, "team", "*"] });
    },
  });
}

export function useSendOrgInvitation(org: string, data: unknown) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.organizations?.sendInvitation?.(org, data) ?? Promise.resolve(undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", org, "invitations"] });
      queryClient.invalidateQueries({ queryKey: ["invitations", "org"] });
    },
  });
}

export function useDeleteOrgInvitation(org: string, id: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.organizations?.deleteInvitation?.(org, id) ?? Promise.resolve({ success: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations", "org"] });
    },
  });
}

export function useAcceptInvitation(token: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.organizations?.acceptInvitation?.(token) ?? Promise.resolve(undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["invitations", "org"] });
    },
  });
}
