'use client';

import { createFileRoute } from '@tanstack/react-router';
import { WorkflowList } from '@/components/workflows/workflow-list';
import { RunList } from '@/components/workflows/run-list';

export const Route = createFileRoute('/_main/$username/$repo/workflows/')({
  component: WorkflowsPage,
});

function WorkflowsPage() {
  const { username, repo } = Route.useParams();

  return (
    <div className="container max-w-[1280px] px-4 py-6 space-y-8">
      <WorkflowList owner={username} repo={repo} />
      <div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
          Recent Runs
        </h3>
        <RunList owner={username} repo={repo} />
      </div>
    </div>
  );
}
