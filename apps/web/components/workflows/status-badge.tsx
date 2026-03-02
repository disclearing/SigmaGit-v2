'use client';

import { Ban, CheckCircle2, Circle, Clock, Loader2, XCircle } from 'lucide-react';
import type { WorkflowJobStatus, WorkflowRunConclusion, WorkflowRunStatus, WorkflowStepStatus } from '@sigmagit/hooks';
import { cn } from '@/lib/utils';

type Status = WorkflowRunStatus | WorkflowJobStatus | WorkflowStepStatus | WorkflowRunConclusion | string;

interface StatusBadgeProps {
  status: Status;
  conclusion?: WorkflowRunConclusion | string | null;
  className?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, conclusion, className, size = 'md' }: StatusBadgeProps) {
  const effective = (conclusion ?? status);

  const config: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
    queued: {
      icon: <Clock className={cn(size === 'sm' ? 'size-3' : 'size-4')} />,
      label: 'Queued',
      className: 'text-muted-foreground',
    },
    assigned: {
      icon: <Clock className={cn(size === 'sm' ? 'size-3' : 'size-4')} />,
      label: 'Assigned',
      className: 'text-muted-foreground',
    },
    in_progress: {
      icon: <Loader2 className={cn(size === 'sm' ? 'size-3' : 'size-4', 'animate-spin')} />,
      label: 'Running',
      className: 'text-blue-500',
    },
    completed: {
      icon: <CheckCircle2 className={cn(size === 'sm' ? 'size-3' : 'size-4')} />,
      label: 'Success',
      className: 'text-green-500',
    },
    success: {
      icon: <CheckCircle2 className={cn(size === 'sm' ? 'size-3' : 'size-4')} />,
      label: 'Success',
      className: 'text-green-500',
    },
    failed: {
      icon: <XCircle className={cn(size === 'sm' ? 'size-3' : 'size-4')} />,
      label: 'Failed',
      className: 'text-destructive',
    },
    failure: {
      icon: <XCircle className={cn(size === 'sm' ? 'size-3' : 'size-4')} />,
      label: 'Failed',
      className: 'text-destructive',
    },
    cancelled: {
      icon: <Ban className={cn(size === 'sm' ? 'size-3' : 'size-4')} />,
      label: 'Cancelled',
      className: 'text-muted-foreground',
    },
    skipped: {
      icon: <Circle className={cn(size === 'sm' ? 'size-3' : 'size-4')} />,
      label: 'Skipped',
      className: 'text-muted-foreground',
    },
  };

  const cfg = config[effective] ?? config.queued;

  return (
    <span className={cn('inline-flex items-center gap-1', cfg.className, className)}>
      {cfg.icon}
      {size !== 'sm' && <span className="text-sm font-medium">{cfg.label}</span>}
    </span>
  );
}
