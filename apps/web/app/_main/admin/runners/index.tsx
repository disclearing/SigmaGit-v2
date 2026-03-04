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
        <p className="font-medium">Add a runner</p>
        <p className="text-muted-foreground">
          Build the agent from the repo root, then run it with your API URL. If the server sets{' '}
          <code className="bg-muted px-1 rounded">SIGMAGIT_RUNNER_SECRET</code>, set the same value on the runner.
        </p>
        <pre className="bg-black text-green-400 font-mono text-xs p-3 rounded-md overflow-auto">
          {`# Build (from repo root)
bun run build:runner

# Run
SIGMAGIT_API_URL=https://your-api.example.com \\
SIGMAGIT_RUNNER_NAME=my-runner \\
SIGMAGIT_RUNNER_SECRET=your-secret-if-required \\
./apps/runner/bin/sigmagit-runner`}
        </pre>
        <p className="text-muted-foreground text-xs">
          The runner registers automatically and polls for jobs. Repo checkouts use{' '}
          <code className="bg-muted px-1 rounded text-[11px]">&lt;API_URL&gt;/&lt;owner&gt;/&lt;repo&gt;.git</code> with
          basic auth <code className="bg-muted px-1 rounded">runner:&lt;token&gt;</code> (token is saved in config after register).
        </p>
      </div>

      <AdminRunnerList />
    </div>
  );
}
