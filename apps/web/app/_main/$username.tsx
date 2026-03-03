import { Outlet, createFileRoute } from "@tanstack/react-router";
import { createMeta } from "@/lib/seo";

export const Route = createFileRoute("/_main/$username")({
  head: ({ params }) => ({
    meta: createMeta({
      title: params.username,
      description: `${params.username} on Sigmagit. Profile and repositories.`,
    }),
  }),
  component: UsernameLayout,
});

function UsernameLayout() {
  return <Outlet />
}
