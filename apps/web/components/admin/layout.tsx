import { Outlet, Link, useLocation } from "@tanstack/react-router";
import { Shield, LayoutDashboard, Users, FolderGit2, Building2, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminLayout() {
  const location = useLocation();
  
  const navItems = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/users", icon: Users, label: "Users" },
    { to: "/admin/repositories", icon: FolderGit2, label: "Repositories" },
    { to: "/admin/organizations", icon: Building2, label: "Organizations" },
    { to: "/admin/audit-logs", icon: FileText, label: "Audit Logs" },
    { to: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <aside className="w-64 border-r border-border bg-muted/30 min-h-screen">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <Shield className="size-5 text-primary" />
              <h1 className="text-lg font-semibold">Admin Panel</h1>
            </div>
          </div>
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to || (item.to !== "/admin" && location.pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
