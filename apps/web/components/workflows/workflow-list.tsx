'use client';

import { useState } from 'react';
import { GitBranch, Play, RefreshCw } from 'lucide-react';
import { useDispatchWorkflow, useSyncWorkflows, useWorkflows } from '@sigmagit/hooks';
import { toast } from 'sonner';
import { Link } from '@tanstack/react-router';
import { RunDialog } from './run-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface WorkflowListProps {
  owner: string;
  repo: string;
}

export function WorkflowList({ owner, repo }: WorkflowListProps) {
  const { data, isLoading } = useWorkflows(owner, repo);
  const syncMutation = useSyncWorkflows(owner, repo);
  const dispatchMutation = useDispatchWorkflow(owner, repo);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  const workflows = data?.workflows ?? [];

  function handleSync() {
    syncMutation.mutate(undefined, {
      onSuccess: () => toast.success('Workflows synced'),
      onError: () => toast.error('Failed to sync workflows'),
    });
  }

  function handleDispatch(workflowId: string) {
    dispatchMutation.mutate(
      { workflowId },
      {
        onSuccess: (result) => {
          toast.success(`Workflow triggered (${result.runIds.length} run${result.runIds.length !== 1 ? 's' : ''})`);
          setDispatchingId(null);
        },
        onError: () => toast.error('Failed to trigger workflow'),
      }
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        Loading workflows…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Workflows
        </h3>
        <Button variant="outline" size="sm" onClick={handleSync} disabled={syncMutation.isPending}>
          <RefreshCw className={`size-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          Sync
        </Button>
      </div>

      {workflows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No workflows found. Add a YAML file to{' '}
          <code className="font-mono text-xs bg-muted px-1 rounded">.sigmagit/workflows/</code>
          {' '}and sync.
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {workflows.map((wf) => (
            <div key={wf.id} className="flex items-center justify-between p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{wf.name}</span>
                  {wf.triggers?.workflow_dispatch && (
                    <Badge variant="secondary" className="text-xs">manual</Badge>
                  )}
                  {wf.triggers?.push && (
                    <Badge variant="outline" className="text-xs">push</Badge>
                  )}
                  {wf.triggers?.pull_request && (
                    <Badge variant="outline" className="text-xs">PR</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <GitBranch className="size-3" />
                  <code className="font-mono">{wf.path}</code>
                </div>
              </div>
              {wf.triggers?.workflow_dispatch && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDispatchingId(wf.id)}
                  disabled={dispatchMutation.isPending}
                >
                  <Play className="size-4" />
                  Run
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <RunDialog
        open={!!dispatchingId}
        onOpenChange={(open) => !open && setDispatchingId(null)}
        onConfirm={() => dispatchingId && handleDispatch(dispatchingId)}
        isPending={dispatchMutation.isPending}
      />
    </div>
  );
}
