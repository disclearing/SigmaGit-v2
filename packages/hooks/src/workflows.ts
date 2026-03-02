import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './context';

export function useWorkflows(owner: string, repo: string) {
  const api = useApi();
  return useQuery({
    queryKey: ['workflows', owner, repo],
    queryFn: () => api.workflows.list(owner, repo),
    enabled: !!owner && !!repo,
  });
}

export function useSyncWorkflows(owner: string, repo: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.workflows.sync(owner, repo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows', owner, repo] });
    },
  });
}

export function useDispatchWorkflow(owner: string, repo: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workflowId, data }: { workflowId: string; data?: { ref?: string; inputs?: Record<string, string> } }) =>
      api.workflows.dispatch(owner, repo, workflowId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-runs', owner, repo] });
    },
  });
}

export function useWorkflowRuns(owner: string, repo: string, page = 1) {
  const api = useApi();
  return useQuery({
    queryKey: ['workflow-runs', owner, repo, page],
    queryFn: () => api.workflows.listRuns(owner, repo, page),
    enabled: !!owner && !!repo,
  });
}

export function useWorkflowRun(owner: string, repo: string, runId: string) {
  const api = useApi();
  return useQuery({
    queryKey: ['workflow-run', owner, repo, runId],
    queryFn: () => api.workflows.getRun(owner, repo, runId),
    enabled: !!owner && !!repo && !!runId,
    refetchInterval: (query) => {
      const run = query.state.data?.run;
      if (!run) return false;
      // Poll while run is active
      if (run.status === 'queued' || run.status === 'in_progress') return 5000;
      return false;
    },
  });
}

export function useJobLogs(owner: string, repo: string, runId: string, jobId: string) {
  const api = useApi();
  return useQuery({
    queryKey: ['job-logs', owner, repo, runId, jobId],
    queryFn: () => api.workflows.getJobLogs(owner, repo, runId, jobId),
    enabled: !!owner && !!repo && !!runId && !!jobId,
  });
}

export function useCancelRun(owner: string, repo: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) => api.workflows.cancelRun(owner, repo, runId),
    onSuccess: (_data, runId) => {
      queryClient.invalidateQueries({ queryKey: ['workflow-runs', owner, repo] });
      queryClient.invalidateQueries({ queryKey: ['workflow-run', owner, repo, runId] });
    },
  });
}

export function useRunners() {
  const api = useApi();
  return useQuery({
    queryKey: ['runners'],
    queryFn: () => api.runners.list(),
    refetchInterval: 15000,
  });
}

export function useRemoveRunner() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (runnerId: string) => api.runners.remove(runnerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['runners'] });
    },
  });
}
