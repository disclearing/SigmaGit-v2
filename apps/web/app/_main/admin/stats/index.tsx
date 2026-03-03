"use client";

import { createFileRoute } from "@tanstack/react-router";
import { useAdminStats, useAdminSystemStats } from "@sigmagit/hooks";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CircleAlert,
  Database,
  FolderGit2,
  GitPullRequest,
  Globe,
  HardDrive,
  Link2,
  Lock,
  Server,
  Shield,
  Timer,
  Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_main/admin/stats/")({
  head: () => ({
    meta: [
      { title: "Stats | Admin Panel | Sigmagit" },
      {
        name: "description",
        content: "System statistics: app uptime, API uptime, PostgreSQL metrics, and platform counts.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminStatsPage,
});

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function StatRow({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 first:pt-0 last:pb-0 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-right">
        <span className="font-medium tabular-nums">{value}</span>
        {sub != null && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

function AdminStatsPage() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useAdminStats();
  const { data: system, isLoading: systemLoading, error: systemError } = useAdminSystemStats();

  const isLoading = statsLoading || systemLoading;
  const hasError = statsError || systemError;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="size-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <BarChart3 className="size-8 text-destructive" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-semibold">Error loading stats</h3>
          <p className="text-sm text-muted-foreground mt-2">
            {(statsError || systemError)?.message ?? "Please try again later."}
          </p>
        </div>
      </div>
    );
  }

  const pg = system?.postgres;
  const pgOk = pg && !pg.error;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stats</h1>
          <p className="text-muted-foreground mt-2">
            App uptime, API health, PostgreSQL metrics, and platform counts.
          </p>
        </div>
        {system?.generatedAt && (
          <Badge variant="outline" className="gap-1.5">
            <Activity className="size-3" />
            Updated {new Date(system.generatedAt).toLocaleTimeString()}
          </Badge>
        )}
      </div>

      {/* Uptime & API */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Timer className="size-5 text-primary" />
              </div>
              <div>
                <CardTitle>App Uptime</CardTitle>
                <CardDescription>Process uptime for this server</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {system?.appUptimeSeconds != null
                ? formatUptime(system.appUptimeSeconds)
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {system?.appUptimeSeconds != null &&
                `${system.appUptimeSeconds.toLocaleString()} seconds`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Server className="size-5 text-green-600" />
              </div>
              <div>
                <CardTitle>API Uptime</CardTitle>
                <CardDescription>API runs in the same process as the app</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {system?.apiUptimeSeconds != null
                ? formatUptime(system.apiUptimeSeconds)
                : "—"}
            </p>
            <Badge variant="outline" className="mt-2 border-green-500/30 text-green-600">
              <Link2 className="size-3 mr-1" />
              Healthy
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* PostgreSQL */}
      <Card className={cn(!pgOk && "border-destructive/50")}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "p-2 rounded-lg",
                pgOk ? "bg-blue-500/10" : "bg-destructive/10"
              )}
            >
              <Database
                className={cn("size-5", pgOk ? "text-blue-600" : "text-destructive")}
              />
            </div>
            <div>
              <CardTitle>PostgreSQL</CardTitle>
              <CardDescription>
                Database version, connections, size, and activity
              </CardDescription>
            </div>
            {pg?.error && (
              <Badge variant="destructive" className="ml-auto">
                <CircleAlert className="size-3 mr-1" />
                Error
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {pg?.error ? (
            <p className="text-sm text-destructive">{pg.error}</p>
          ) : (
            <div className="space-y-1">
              {pg?.version != null && (
                <StatRow
                  label="Version"
                  value={
                    <span className="text-sm font-mono max-w-[240px] truncate block">
                      {pg.version}
                    </span>
                  }
                />
              )}
              <StatRow
                label="Connections"
                value={pg?.connections ?? "—"}
                sub={pg?.connections != null ? "current database" : undefined}
              />
              <StatRow
                label="Database size"
                value={
                  pg?.databaseSizeBytes != null
                    ? formatBytes(pg.databaseSizeBytes)
                    : "—"
                }
              />
              <StatRow
                label="Cache hit ratio"
                value={
                  pg?.cacheHitRatio != null ? `${pg.cacheHitRatio}%` : "—"
                }
                sub="buffer cache effectiveness"
              />
              <StatRow
                label="Transactions committed"
                value={
                  pg?.transactionsCommitted != null
                    ? pg.transactionsCommitted.toLocaleString()
                    : "—"
                }
              />
              <StatRow
                label="Transactions rolled back"
                value={
                  pg?.transactionsRolledBack != null
                    ? pg.transactionsRolledBack.toLocaleString()
                    : "—"
                }
              />
              <StatRow
                label="Rows returned"
                value={
                  pg?.rowsReturned != null
                    ? pg.rowsReturned.toLocaleString()
                    : "—"
                }
              />
              <StatRow
                label="Rows fetched"
                value={
                  pg?.rowsFetched != null
                    ? pg.rowsFetched.toLocaleString()
                    : "—"
                }
              />
              <StatRow
                label="Rows inserted"
                value={
                  pg?.rowsInserted != null
                    ? pg.rowsInserted.toLocaleString()
                    : "—"
                }
              />
              <StatRow
                label="Rows updated"
                value={
                  pg?.rowsUpdated != null
                    ? pg.rowsUpdated.toLocaleString()
                    : "—"
                }
              />
              <StatRow
                label="Rows deleted"
                value={
                  pg?.rowsDeleted != null
                    ? pg.rowsDeleted.toLocaleString()
                    : "—"
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform counts (from existing admin stats) */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Platform counts</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/admin/users">
            <Card className="transition-colors hover:bg-accent/50 cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Users className="size-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums">
                      {stats?.userCount?.toLocaleString() ?? "—"}
                    </p>
                    <p className="text-sm text-muted-foreground">Users</p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground ml-auto" />
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/admin/repositories">
            <Card className="transition-colors hover:bg-accent/50 cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <FolderGit2 className="size-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums">
                      {stats?.repoCount?.toLocaleString() ?? "—"}
                    </p>
                    <p className="text-sm text-muted-foreground">Repositories</p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground ml-auto" />
                </div>
              </CardContent>
            </Card>
          </Link>
          <Card className="h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Globe className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">
                    {stats?.publicRepoCount?.toLocaleString() ?? "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">Public repos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Lock className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">
                    {stats?.privateRepoCount?.toLocaleString() ?? "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">Private repos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <GitPullRequest className="size-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">
                    {stats?.prCount?.toLocaleString() ?? "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">Pull requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <CircleAlert className="size-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">
                    {stats?.issueCount?.toLocaleString() ?? "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">Issues</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10">
                  <HardDrive className="size-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">
                    {stats?.gistCount?.toLocaleString() ?? "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">Gists</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Shield className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">
                    {stats?.adminCount?.toLocaleString() ?? "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">Admins</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
