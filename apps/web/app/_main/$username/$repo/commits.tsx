import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { createMeta } from "@/lib/seo";

export const Route = createFileRoute("/_main/$username/$repo/commits")({
  head: ({ params }) => ({
    meta: createMeta({
      title: `${params.username}/${params.repo} · Commits`,
      description: `Commit history for ${params.username}/${params.repo} on Sigmagit.`,
    }),
  }),
  component: CommitsLayout,
});

function CommitsLayout() {
  return <Outlet />
}

