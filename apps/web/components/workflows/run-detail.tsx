'use client';

import { useState } from 'react';
import { Clock, GitBranch, GitCommit, X } from 'lucide-react';
import { useCancelRun, useWorkflowRun } from '@sigmagit/hooks';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { StatusBadge } from './status-badge';
import { JobDetail } from './job-detail';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RunDetailProps {
  owner: string;
  repo: string;
  runId: string;
}

export function RunDetail({ owner, repo, runId }: RunDetailProps) {
  const { data, isLoading } = useWorkflowRun(owner, repo, runId);
  const cancelMutation = useCancelRun(owner, repo);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        Loading run…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        Run not found.
      </div>
    );
  }

  const { run, jobs } = data;
  const selectedJob = selectedJobId
    ? jobs.find((j) => j.id === selectedJobId)
    : jobs[0];

  const isActive = run.status === 'queued' || run.status === 'in_progress';

  function handleCancel() {
    cancelMutation.mutate(runId, {
      onSuccess: () => toast.success('Run cancelled'),
      onError: () => toast.error('Failed to cancel run'),
    });
  }

  return (
    <div className="space-y-6">
      {/* Run header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <StatusBadge status={run.status} conclusion={run.conclusion} />
            <h2 className="text-lg font-semibold">Run {run.id.slice(0, 8)}</h2>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <GitBranch className="size-4" />
              {run.branch}
            </span>
            <span className="flex items-center gap-1">
              <GitCommit className="size-4" />
              <code className="font-mono text-xs">{run.commitSha.slice(0, 7)}</code>
            </span>
            <span className="capitalize">{run.eventName.replace('_', ' ')}</span>
            <span className="flex items-center gap-1">
              <Clock className="size-4" />
              {formatDistanceToNow(new Date(run.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
        {isActive && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={cancelMutation.isPending}
            className="text-destructive hover:text-destructive"
          >
            <X className="size-4" />
            Cancel
          </Button>
        )}
      </div>

      {/* Jobs + detail */}
      <div className="flex gap-6">
        {/* Job list */}
        <div className="w-56 shrink-0 space-y-1">
          {jobs.map((job) => (
            <button
              key={job.id}
              onClick={() => setSelectedJobId(job.id)}
              className={cn(
                'w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors',
                selectedJob?.id === job.id
                  ? 'bg-muted font-medium'
                  : 'hover:bg-muted/50 text-muted-foreground'
              )}
            >
              <StatusBadge status={job.status} conclusion={job.conclusion} size="sm" />
              <span className="truncate">{job.name}</span>
            </button>
          ))}
        </div>

        {/* Selected job detail */}
        <div className="flex-1 min-w-0">
          {selectedJob ? (
            <JobDetail owner={owner} repo={repo} runId={runId} job={selectedJob} />
          ) : (
            <div className="text-sm text-muted-foreground">Select a job to view details.</div>
          )}
        </div>
      </div>
    </div>
  );
}
