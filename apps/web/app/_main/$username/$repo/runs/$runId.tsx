'use client';

import { createFileRoute } from '@tanstack/react-router';
import { RunDetail } from '@/components/workflows/run-detail';

export const Route = createFileRoute('/_main/$username/$repo/runs/$runId')({
  component: RunDetailPage,
});

function RunDetailPage() {
  const { username, repo, runId } = Route.useParams();

  return (
    <div className="container max-w-[1280px] px-4 py-6">
      <RunDetail owner={username} repo={repo} runId={runId} />
    </div>
  );
}
