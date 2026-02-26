"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { useAdminStats } from "@sigmagit/hooks";
import {
  Users,
  FolderGit2,
  Building2,
  CircleAlert,
  GitPullRequest,
  FileCode,
  Globe,
  Lock,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowRight,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_main/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard | Admin Panel | Sigmagit" },
      {
        name: "description",
        content: "View platform statistics, user counts, repository metrics, and system overview.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminDashboard,
});

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  subtitle?: string;
  trend?: { value: number; label: string; positive?: boolean };
  color?: "blue" | "green" | "purple" | "orange" | "red" | "cyan";
  href?: string;
}

const colorVariants = {
  blue: "from-blue-500/20 to-blue-500/5 text-blue-600",
  green: "from-green-500/20 to-green-500/5 text-green-600",
  purple: "from-purple-500/20 to-purple-500/5 text-purple-600",
  orange: "from-orange-500/20 to-orange-500/5 text-orange-600",
  red: "from-red-500/20 to-red-500/5 text-red-600",
  cyan: "from-cyan-500/20 to-cyan-500/5 text-cyan-600",
};

function StatCard({ title, value, icon: Icon, subtitle, trend, color = "blue", href }: StatCardProps) {
  const content = (
    <Card className={cn("group transition-all duration-300 hover:shadow-lg hover:border-primary/20", href && "cursor-pointer")}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className={cn("p-3 rounded-xl bg-gradient-to-br w-fit", colorVariants[color])}>
              <Icon className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-3xl font-bold mt-1">{value.toLocaleString()}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
              )}
              {trend && (
                <div className="flex items-center gap-1 mt-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      trend.positive ? "border-green-500/30 text-green-600" : "border-red-500/30 text-red-600"
                    )}
                  >
                    {trend.positive ? "+" : ""}{trend.value}%
                  </Badge>
                  <span className="text-xs text-muted-foreground">{trend.label}</span>
                </div>
              )}
            </div>
          </div>
          {href && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="size-5 text-muted-foreground" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }
  return content;
}

function AdminDashboard() {
  const { data: stats, isLoading, error } = useAdminStats();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="size-20 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <Shield className="size-10 text-destructive" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-semibold">Error loading dashboard</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Please try refreshing the page or check your connection
          </p>
        </div>
        <Button onClick={() => window.location.reload()}>Refresh Page</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Here's what's happening on your platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <Activity className="size-3" />
            Live
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats?.userCount || 0}
          icon={Users}
          color="blue"
          trend={stats?.recentUsers ? { value: Math.round((stats.recentUsers / (stats.userCount || 1)) * 100), label: "last 30 days", positive: true } : undefined}
          href="/admin/users"
        />
        <StatCard
          title="Repositories"
          value={stats?.repoCount || 0}
          icon={FolderGit2}
          color="green"
          trend={stats?.recentRepos ? { value: Math.round((stats.recentRepos / (stats.repoCount || 1)) * 100), label: "last 30 days", positive: true } : undefined}
          href="/admin/repositories"
        />
        <StatCard
          title="Organizations"
          value={stats?.orgCount || 0}
          icon={Building2}
          color="purple"
          href="/admin/organizations"
        />
        <StatCard
          title="Issues"
          value={stats?.issueCount || 0}
          icon={CircleAlert}
          color="orange"
          subtitle={stats?.openIssueCount ? `${stats.openIssueCount} open` : undefined}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pull Requests"
          value={stats?.prCount || 0}
          icon={GitPullRequest}
          color="cyan"
          subtitle={stats?.openPrCount ? `${stats.openPrCount} open` : undefined}
        />
        <StatCard
          title="Gists"
          value={stats?.gistCount || 0}
          icon={FileCode}
          color="purple"
        />
        <StatCard
          title="Public Repos"
          value={stats?.publicRepoCount || 0}
          icon={Globe}
          color="green"
        />
        <StatCard
          title="Private Repos"
          value={stats?.privateRepoCount || 0}
          icon={Lock}
          color="red"
        />
      </div>

      {/* Quick Actions & Info */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/admin/users">
              <Button variant="outline" className="w-full justify-between h-12">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Users className="size-4 text-blue-600" />
                  </div>
                  <span className="font-medium">Manage Users</span>
                </div>
                <ArrowRight className="size-4 text-muted-foreground" />
              </Button>
            </Link>
            <Link to="/admin/repositories">
              <Button variant="outline" className="w-full justify-between h-12">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <FolderGit2 className="size-4 text-green-600" />
                  </div>
                  <span className="font-medium">Manage Repositories</span>
                </div>
                <ArrowRight className="size-4 text-muted-foreground" />
              </Button>
            </Link>
            <Link to="/admin/audit-logs">
              <Button variant="outline" className="w-full justify-between h-12">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Activity className="size-4 text-orange-600" />
                  </div>
                  <span className="font-medium">View Audit Logs</span>
                </div>
                <ArrowRight className="size-4 text-muted-foreground" />
              </Button>
            </Link>
            <Link to="/admin/settings">
              <Button variant="outline" className="w-full justify-between h-12">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Shield className="size-4 text-purple-600" />
                  </div>
                  <span className="font-medium">System Settings</span>
                </div>
                <ArrowRight className="size-4 text-muted-foreground" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Platform Health */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Health</CardTitle>
            <CardDescription>System status overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-green-500/5 border border-green-500/20">
              <div className="flex items-center gap-3">
                <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-medium">System Status</span>
              </div>
              <Badge variant="outline" className="border-green-500/30 text-green-600">
                Operational
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold mt-1">{stats?.userCount || 0}</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-sm text-muted-foreground">New (30d)</p>
                <p className="text-2xl font-bold mt-1 text-green-600">+{stats?.recentUsers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
