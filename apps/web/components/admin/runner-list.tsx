'use client';

import { Activity, Trash2, Wifi, WifiOff } from 'lucide-react';
import { useRemoveRunner, useRunners } from '@sigmagit/hooks';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function AdminRunnerList() {
  const { data, isLoading } = useRunners();
  const removeMutation = useRemoveRunner();
  const runners = data?.runners ?? [];

  function handleRemove(id: string, name: string) {
    if (!confirm(`Deregister runner "${name}"? Any active jobs will be failed.`)) return;
    removeMutation.mutate(id, {
      onSuccess: () => toast.success(`Runner "${name}" deregistered`),
      onError: () => toast.error('Failed to deregister runner'),
    });
  }

  const statusIcon = (status: string) => {
    if (status === 'online') return <Wifi className="size-4 text-green-500" />;
    if (status === 'busy') return <Activity className="size-4 text-blue-500" />;
    return <WifiOff className="size-4 text-muted-foreground" />;
  };

  const statusColor = (status: string) => {
    if (status === 'online') return 'bg-green-500/10 text-green-600 border-green-500/20';
    if (status === 'busy') return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    return 'bg-muted text-muted-foreground';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        Loading runners…
      </div>
    );
  }

  if (runners.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center space-y-2">
        <p className="text-sm font-medium">No runners registered</p>
        <p className="text-xs text-muted-foreground">
          Register a runner by running the agent with <code className="bg-muted px-1 rounded">SIGMAGIT_API_URL=… sigmagit-runner</code>
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y rounded-lg border">
      {runners.map((runner) => (
        <div key={runner.id} className="flex items-center justify-between p-4 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {statusIcon(runner.status)}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{runner.name}</span>
                <Badge variant="outline" className={cn('text-xs', statusColor(runner.status))}>
                  {runner.status}
                </Badge>
                {runner.labels?.map((label) => (
                  <Badge key={label} variant="secondary" className="text-xs">
                    {label}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                {runner.os && <span>{runner.os}/{runner.arch}</span>}
                {runner.version && <span>v{runner.version}</span>}
                {runner.ipAddress && <span>{runner.ipAddress}</span>}
                {runner.lastSeenAt && (
                  <span>
                    Last seen {formatDistanceToNow(new Date(runner.lastSeenAt), { addSuffix: true })}
                  </span>
                )}
                {runner.currentJobId && (
                  <span className="text-blue-500">
                    Running job {runner.currentJobId.slice(0, 8)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive shrink-0"
            onClick={() => handleRemove(runner.id, runner.name)}
            disabled={removeMutation.isPending}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
