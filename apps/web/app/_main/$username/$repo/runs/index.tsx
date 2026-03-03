'use client';

import { createFileRoute } from '@tanstack/react-router';
import { createMeta } from '@/lib/seo';
import { RunList } from '@/components/workflows/run-list';

export const Route = createFileRoute('/_main/$username/$repo/runs/')({
  head: ({ params }) => ({
    meta: createMeta({
      title: `${params.username}/${params.repo} · Workflow Runs`,
      description: `Workflow run history for ${params.username}/${params.repo} on Sigmagit.`,
    }),
  }),
  component: RunsPage,
});

function RunsPage() {
  const { username, repo } = Route.useParams();

  return (
    <div className="container max-w-[1280px] px-4 py-6 space-y-4">
      <h2 className="text-xl font-semibold">Workflow Runs</h2>
      <RunList owner={username} repo={repo} />
    </div>
  );
}
