'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useJobLogs } from '@sigmagit/hooks';
import { differenceInSeconds, formatDistanceToNow } from 'date-fns';
import { StatusBadge } from './status-badge';
import { LogViewer } from './log-viewer';
import type { WorkflowJob } from '@sigmagit/hooks';
import { cn } from '@/lib/utils';

interface JobDetailProps {
  owner: string;
  repo: string;
  runId: string;
  job: WorkflowJob;
}

export function JobDetail({ owner, repo, runId, job }: JobDetailProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [showAllLogs, setShowAllLogs] = useState(false);
  const { data: logsData } = useJobLogs(owner, repo, runId, job.id);

  const steps = job.steps ?? logsData?.steps ?? [];
  const allLogs = logsData?.logs ?? '';

  function toggleStep(id: string) {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function duration(start?: string | null, end?: string | null) {
    if (!start) return null;
    const s = new Date(start);
    const e = end ? new Date(end) : new Date();
    const secs = differenceInSeconds(e, s);
    if (secs < 60) return `${secs}s`;
    return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  }

  return (
    <div className="space-y-3">
      {/* Job header */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <StatusBadge status={job.status} conclusion={job.conclusion} />
          <span className="font-medium">{job.name}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {duration(job.startedAt, job.completedAt) && (
            <span>{duration(job.startedAt, job.completedAt)}</span>
          )}
        </div>
      </div>

      {/* Steps */}
      {steps.length > 0 && (
        <div className="divide-y rounded-lg border">
          {steps.map((step) => {
            const isExpanded = expandedSteps.has(step.id);
            return (
              <div key={step.id}>
                <button
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                  onClick={() => toggleStep(step.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="size-4 shrink-0" /> : <ChevronRight className="size-4 shrink-0" />}
                    <StatusBadge status={step.status} size="sm" />
                    <span className="text-sm">{step.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {duration(step.startedAt, step.completedAt)}
                    {step.exitCode != null && step.exitCode !== 0 && (
                      <span className="ml-2 text-destructive">exit {step.exitCode}</span>
                    )}
                  </span>
                </button>
                {isExpanded && step.logOutput && (
                  <div className="px-3 pb-3">
                    <LogViewer logs={step.logOutput} className="max-h-96 text-xs" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Full log viewer */}
      {allLogs && (
        <div>
          <button
            className="text-sm text-muted-foreground hover:text-foreground mb-2"
            onClick={() => setShowAllLogs((v) => !v)}
          >
            {showAllLogs ? 'Hide' : 'Show'} full logs
          </button>
          {showAllLogs && <LogViewer logs={allLogs} className="max-h-[600px]" autoScroll />}
        </div>
      )}
    </div>
  );
}
