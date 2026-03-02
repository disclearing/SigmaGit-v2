'use client';

import { createFileRoute } from '@tanstack/react-router';
import { Server } from 'lucide-react';
import { AdminRunnerList } from '@/components/admin/runner-list';

export const Route = createFileRoute('/_main/admin/runners/')({
  head: () => ({
    meta: [
      { title: 'Runners | Admin Panel | Sigmagit' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: AdminRunnersPage,
});

function AdminRunnersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Server className="size-6" />
        <div>
          <h1 className="text-2xl font-bold">Runners</h1>
          <p className="text-sm text-muted-foreground">
            Manage self-hosted runners that execute workflow jobs.
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-2">
        <p className="font-medium">Registering a new runner</p>
        <p className="text-muted-foreground">
          Download the runner agent and start it with your API URL:
        </p>
        <pre className="bg-black text-green-400 font-mono text-xs p-3 rounded-md overflow-auto">
          {`SIGMAGIT_API_URL=https://your-api.example.com \\
SIGMAGIT_RUNNER_NAME=my-runner \\
./sigmagit-runner`}
        </pre>
        <p className="text-muted-foreground text-xs">
          The runner will register automatically and start polling for jobs. Run{' '}
          <code className="bg-muted px-1 rounded">bun run build:runner</code> to build the agent binary from source.
        </p>
      </div>

      <AdminRunnerList />
    </div>
  );
}
