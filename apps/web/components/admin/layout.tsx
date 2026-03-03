"use client";

import { Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  BarChart3,
  Briefcase,
  Building2,
  ChevronRight,
  FileCode,
  FileText,
  FolderGit2,
  Home,
  LayoutDashboard,
  LogOut,
  Server,
  Settings,
  Shield,
  Users,
  Wrench,
} from "lucide-react";
import { useCurrentUserSummary } from "@sigmagit/hooks";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut, useSession } from "@/lib/auth-client";

export function AdminLayout() {
  const location = useLocation();
  const { data: session } = useSession();
  const { data: user } = useCurrentUserSummary(!!session?.user);
  
  const navItems = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard", description: "Overview & stats" },
    { to: "/admin/stats", icon: BarChart3, label: "Stats", description: "Uptime, API & Postgres" },
    { to: "/admin/users", icon: Users, label: "Users", description: "Manage accounts" },
    { to: "/admin/repositories", icon: FolderGit2, label: "Repositories", description: "All repos" },
    { to: "/admin/organizations", icon: Building2, label: "Organizations", description: "Teams & orgs" },
    { to: "/admin/gists", icon: FileCode, label: "Gists", description: "Code snippets" },
    { to: "/admin/applications", icon: Briefcase, label: "Applications", description: "Jobs & career applications" },
    { to: "/admin/audit-logs", icon: FileText, label: "Audit Logs", description: "Activity tracking" },
    { to: "/admin/runners", icon: Server, label: "Runners", description: "CI/CD runner agents" },
    { to: "/admin/utils", icon: Wrench, label: "Utils", description: "Cleanup & maintenance" },
    { to: "/admin/settings", icon: Settings, label: "Settings", description: "System config" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-full min-h-screen w-64 flex-shrink-0 flex-col border-r border-border bg-card lg:flex xl:w-72">
          {/* Header */}
          <div className="p-5 xl:p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-primary to-primary/70 p-2.5 shadow-lg shadow-primary/20">
                <Shield className="size-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Admin Panel</h1>
                <p className="text-xs text-muted-foreground">Platform Management</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 xl:p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to || (item.to !== "/admin" && location.pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    isActive ? "bg-primary-foreground/20" : "bg-muted group-hover:bg-accent"
                  )}>
                  <Icon className="size-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{item.label}</div>
                    <div className={cn(
                      "text-xs",
                      isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {item.description}
                    </div>
                  </div>
                  <ChevronRight className={cn(
                    "size-4 transition-transform",
                    isActive ? "opacity-100" : "opacity-0 -translate-x-2"
                  )} />
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border space-y-3">
            <Link to="/">
              <Button variant="outline" className="w-full justify-start gap-2 h-11">
                <Home className="size-4" />
                Back to Site
              </Button>
            </Link>
            
            {user && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <Avatar className="size-9">
                  <AvatarImage src={user.avatarUrl || undefined} />
                  <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-muted to-muted/50">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">Administrator</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={() => signOut()}
                >
                  <LogOut className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
