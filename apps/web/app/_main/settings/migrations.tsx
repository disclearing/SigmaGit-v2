"use client";

import { Link, createFileRoute } from "@tanstack/react-router";
import { useMigrations } from "@sigmagit/hooks";
import { CheckCircle2, Clock, Download, Loader2, XCircle } from "lucide-react";
import { timeAgo } from "@sigmagit/lib";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_main/settings/migrations")({
  component: MigrationsPage,
});

function MigrationsPage() {
  const { data, isLoading } = useMigrations();

  const migrations = data?.migrations || [];

  function getStatusIcon(status: string) {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="size-4 text-green-500" />;
      case "failed":
        return <XCircle className="size-4 text-destructive" />;
      case "pending":
      case "cloning":
      case "importing":
        return <Loader2 className="size-4 animate-spin text-primary" />;
      default:
        return <Clock className="size-4 text-muted-foreground" />;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "completed":
        return "text-green-600 dark:text-green-400";
      case "failed":
        return "text-destructive";
      case "pending":
      case "cloning":
      case "importing":
        return "text-primary";
      default:
        return "text-muted-foreground";
    }
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Repository Migrations</h1>
          <p className="text-muted-foreground mt-1">View and manage your repository imports</p>
        </div>
        <Link to="/new/import">
          <Button className="gap-2">
            <Download className="size-4" />
            Import repository
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border border-border bg-card p-6 animate-pulse">
              <div className="h-6 w-48 bg-muted mb-2" />
              <div className="h-4 w-32 bg-muted" />
            </div>
          ))}
        </div>
      ) : migrations.length === 0 ? (
        <div className="border border-dashed border-border bg-muted/20 p-12 text-center rounded-lg">
          <Download className="size-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold mb-2">No migrations yet</h3>
          <p className="text-muted-foreground mb-6">Import your first repository from GitHub, GitLab, or any Git URL</p>
          <Link to="/new/import">
            <Button className="gap-2">
              <Download className="size-4" />
              Import repository
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {migrations.map((migration) => (
            <div key={migration.id} className="border border-border bg-card rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(migration.status)}
                    <h3 className="font-semibold">
                      {migration.sourceOwner && migration.sourceRepo
                        ? `${migration.sourceOwner}/${migration.sourceRepo}`
                        : migration.sourceUrl}
                    </h3>
                    <span className={`text-sm capitalize ${getStatusColor(migration.status)}`}>
                      {migration.status}
                    </span>
                  </div>
                  {migration.errorMessage && (
                    <p className="text-sm text-destructive mb-2">{migration.errorMessage}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Source: {migration.source}</span>
                    <span>Progress: {migration.progress}%</span>
                    <span>Started {timeAgo(migration.createdAt)}</span>
                  </div>
                  {migration.repositoryId && (
                    <div className="mt-3">
                      <Link
                        to="/$username/$repo"
                        params={{
                          username: migration.sourceOwner || "",
                          repo: migration.sourceRepo || "",
                        }}
                      >
                        <Button variant="outline" size="sm">
                          View repository
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
