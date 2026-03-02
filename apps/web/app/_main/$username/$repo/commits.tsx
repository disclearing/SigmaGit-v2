import { Link, Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_main/$username/$repo/commits")({
  component: CommitsLayout,
})

function CommitsLayout() {
  return <Outlet />
}

