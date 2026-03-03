"use client";

import { createFileRoute } from "@tanstack/react-router";
import {
  useAdminUtilsPreview,
  useCleanupEmptyRepos,
  useCleanupUnactivatedAccounts,
  useCleanupExpiredSessions,
  useCleanupExpiredVerifications,
} from "@sigmagit/hooks";
import {
  AlertTriangle,
  FolderGit2,
  KeyRound,
  Loader2,
  Mail,
  Trash2,
  Users,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_main/admin/utils/")({
  head: () => ({
    meta: [
      { title: "Utils | Admin Panel | Sigmagit" },
      {
        name: "description",
        content: "Manual cleanup utilities: empty repos, unactivated accounts, expired sessions.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminUtilsPage,
});

function UtilsActionCard({
  title,
  description,
  count,
  countLabel,
  onRun,
  isRunning,
  icon: Icon,
  danger,
}: {
  title: string;
  description: string;
  count: number;
  countLabel: string;
  onRun: () => void;
  isRunning: boolean;
  icon: React.ElementType;
  danger?: boolean;
}) {
  return (
    <Card className={cn(danger && "border-destructive/30")}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-lg",
                danger ? "bg-destructive/10" : "bg-muted"
              )}
            >
              <Icon className={cn("size-5", danger ? "text-destructive" : "text-muted-foreground")} />
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <Badge variant={count > 0 ? (danger ? "destructive" : "secondary") : "outline"}>
            {count} {countLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Button
          variant={danger ? "destructive" : "default"}
          size="sm"
          onClick={onRun}
          disabled={count === 0 || isRunning}
        >
          {isRunning ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Running…
            </>
          ) : (
            <>
              <Trash2 className="size-4 mr-2" />
              Run cleanup
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function AdminUtilsPage() {
  const { data: preview, isLoading, error } = useAdminUtilsPreview();
  const cleanupEmptyRepos = useCleanupEmptyRepos();
  const cleanupUnactivated = useCleanupUnactivatedAccounts();
  const cleanupSessions = useCleanupExpiredSessions();
  const cleanupVerifications = useCleanupExpiredVerifications();

  const handleCleanupEmptyRepos = async () => {
    try {
      const { deleted } = await cleanupEmptyRepos.mutateAsync();
      toast.success(`Removed ${deleted} empty repos.`);
    } catch {
      toast.error("Failed to cleanup empty repos.");
    }
  };

  const handleCleanupUnactivated = async () => {
    try {
      const { deleted } = await cleanupUnactivated.mutateAsync();
      toast.success(`Removed ${deleted} unactivated accounts.`);
    } catch {
      toast.error("Failed to cleanup unactivated accounts.");
    }
  };

  const handleCleanupSessions = async () => {
    try {
      const { deleted } = await cleanupSessions.mutateAsync();
      toast.success(`Removed ${deleted} expired sessions.`);
    } catch {
      toast.error("Failed to cleanup expired sessions.");
    }
  };

  const handleCleanupVerifications = async () => {
    try {
      const { deleted } = await cleanupVerifications.mutateAsync();
      toast.success(`Removed ${deleted} expired verifications.`);
    } catch {
      toast.error("Failed to cleanup expired verifications.");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="size-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="size-8 text-destructive" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-semibold">Error loading utils</h3>
          <p className="text-sm text-muted-foreground mt-2">
            {(error as Error)?.message ?? "Please try again later."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Utils</h1>
        <p className="text-muted-foreground mt-2">
          Manual cleanup actions. Each action is run on demand and affects only the listed items.
        </p>
      </div>

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
        <Wrench className="size-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-amber-700 dark:text-amber-400">Manual run only</p>
          <p className="text-muted-foreground mt-1">
            These utilities do not run automatically. Use them to remove empty repositories,
            unactivated accounts (email never verified, no repos, older than 7 days), and expired
            sessions or verification records.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <UtilsActionCard
          title="Empty repositories"
          description="Repos that have no branch metadata (never had a push). Storage and cache are cleaned."
          count={preview?.emptyRepos ?? 0}
          countLabel="repos"
          onRun={handleCleanupEmptyRepos}
          isRunning={cleanupEmptyRepos.isPending}
          icon={FolderGit2}
        />
        <UtilsActionCard
          title="Unactivated accounts"
          description="Users with email never verified, no repositories, account older than 7 days. Admins/moderators are excluded."
          count={preview?.unactivatedAccounts ?? 0}
          countLabel="accounts"
          onRun={handleCleanupUnactivated}
          isRunning={cleanupUnactivated.isPending}
          icon={Users}
          danger
        />
        <UtilsActionCard
          title="Expired sessions"
          description="Session records whose expiry time has passed. Safe to remove."
          count={preview?.expiredSessions ?? 0}
          countLabel="sessions"
          onRun={handleCleanupSessions}
          isRunning={cleanupSessions.isPending}
          icon={Mail}
        />
        <UtilsActionCard
          title="Expired verifications"
          description="Expired email/verification tokens. Safe to remove."
          count={preview?.expiredVerifications ?? 0}
          countLabel="records"
          onRun={handleCleanupVerifications}
          isRunning={cleanupVerifications.isPending}
          icon={KeyRound}
        />
      </div>
    </div>
  );
}
