'use client';

import { ChevronRight, GitBranch, GitCommit } from 'lucide-react';
import { useWorkflowRuns } from '@sigmagit/hooks';
import { Link } from '@tanstack/react-router';
import { formatDistanceToNow } from 'date-fns';
import { StatusBadge } from './status-badge';

interface RunListProps {
  owner: string;
  repo: string;
}

export function RunList({ owner, repo }: RunListProps) {
  const { data, isLoading } = useWorkflowRuns(owner, repo);
  const runs = data?.runs ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        Loading runs…
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No workflow runs yet. Push a commit or trigger a workflow manually.
      </div>
    );
  }

  return (
    <div className="divide-y rounded-lg border">
      {runs.map((run) => (
        <Link
          key={run.id}
          to="/$username/$repo/runs/$runId"
          params={{ username: owner, repo, runId: run.id }}
          className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-4 min-w-0">
            <StatusBadge
              status={run.status}
              conclusion={run.conclusion}
              size="sm"
            />
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">
                {run.workflowName ?? 'Workflow run'}
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <GitBranch className="size-3" />
                  {run.branch}
                </span>
                <span className="flex items-center gap-1">
                  <GitCommit className="size-3" />
                  <code className="font-mono">{run.commitSha.slice(0, 7)}</code>
                </span>
                <span>{run.eventName}</span>
                <span>
                  {formatDistanceToNow(new Date(run.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
          <ChevronRight className="size-4 text-muted-foreground shrink-0" />
        </Link>
      ))}
    </div>
  );
}
