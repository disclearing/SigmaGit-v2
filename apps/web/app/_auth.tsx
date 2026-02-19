import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { Home, GitBranch } from "lucide-react";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4">
      <div className="relative z-10 flex flex-col items-center w-full max-w-[400px]">
        <Link to="/" className="flex items-center gap-3 mb-10 group">
          <div className="relative">
            <GitBranch className="size-10 text-foreground transition-transform group-hover:scale-110" />
          </div>
          <span className="text-2xl font-semibold tracking-tight">sigmagit</span>
        </Link>
        <Outlet />
      </div>
    </div>
  );
}
