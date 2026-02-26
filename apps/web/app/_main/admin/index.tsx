import { createFileRoute } from "@tanstack/react-router";
import { useAdminStats } from "@sigmagit/hooks";
import { Users, FolderGit2, Building2, CircleAlert, GitPullRequest, FileCode, Globe, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_main/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard | Admin Panel | Sigmagit" },
      {
        name: "description",
        content: "View platform statistics, user counts, repository metrics, and system overview.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Dashboard | Admin Panel | Sigmagit" },
      {
        property: "og:description",
        content: "View platform statistics, user counts, repository metrics, and system overview.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Dashboard | Admin Panel | Sigmagit" },
      {
        name: "twitter:description",
        content: "View platform statistics, user counts, repository metrics, and system overview.",
      },
    ],
  }),
  component: AdminDashboard,
});

function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  subtitle?: string;
  trend?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value.toLocaleString()}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <p className="text-xs text-muted-foreground mt-1">{trend}</p>
            )}
          </div>
          <div className="rounded-full bg-primary/10 p-3">
            <Icon className="size-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminDashboard() {
  const { data: stats, isLoading, error } = useAdminStats();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <CircleAlert className="size-12 text-destructive" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">Error loading stats</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Please try refreshing the page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Overview of platform statistics</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats?.userCount || 0}
          icon={Users}
          trend={stats?.recentUsers ? `+${stats.recentUsers} in last 30 days` : undefined}
        />
        <StatCard
          title="Total Repositories"
          value={stats?.repoCount || 0}
          icon={FolderGit2}
          trend={stats?.recentRepos ? `+${stats.recentRepos} in last 30 days` : undefined}
        />
        <StatCard
          title="Organizations"
          value={stats?.orgCount || 0}
          icon={Building2}
        />
        <StatCard
          title="Issues"
          value={stats?.issueCount || 0}
          icon={CircleAlert}
          subtitle={stats?.openIssueCount ? `${stats.openIssueCount} open` : undefined}
        />
        <StatCard
          title="Pull Requests"
          value={stats?.prCount || 0}
          icon={GitPullRequest}
          subtitle={stats?.openPrCount ? `${stats.openPrCount} open` : undefined}
        />
        <StatCard
          title="Gists"
          value={stats?.gistCount || 0}
          icon={FileCode}
        />
        <StatCard
          title="Public Repositories"
          value={stats?.publicRepoCount || 0}
          icon={Globe}
        />
        <StatCard
          title="Private Repositories"
          value={stats?.privateRepoCount || 0}
          icon={Lock}
        />
      </div>
    </div>
  );
}
