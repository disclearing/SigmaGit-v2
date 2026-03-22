import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  useAdminReportAction,
  useAdminReports,
  useUpdateAdminReport,
} from "@sigmagit/hooks";
import {
  AlertTriangle,
  Ban,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileWarning,
  Filter,
  Flag,
  MessageSquareWarning,
  MoreHorizontal,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { Report } from "@sigmagit/hooks";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "reviewing", label: "Reviewing" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
];

const TARGET_TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "user", label: "User" },
  { value: "repository", label: "Repository" },
  { value: "gist", label: "Gist" },
  { value: "organization", label: "Organization" },
];

const REASON_LABELS: Record<string, string> = {
  spam: "Spam",
  harassment: "Harassment",
  inappropriate: "Inappropriate",
  impersonation: "Impersonation",
  other: "Other",
};

function targetLink(report: Report): string {
  switch (report.targetType) {
    case "user":
      return `/admin/users/${report.targetId}`;
    default:
      return "#";
  }
}

export const Route = createFileRoute("/_main/admin/reports/")({
  head: () => ({
    meta: [
      { title: "Reports | Admin Panel | Sigmagit" },
      { name: "description", content: "User and content reports." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminReports,
});

function AdminReports() {
  const [status, setStatus] = useState("all");
  const [targetType, setTargetType] = useState("all");
  const [page, setPage] = useState(0);
  const limit = 20;

  const statusFilter = status === "all" ? undefined : status;
  const targetTypeFilter = targetType === "all" ? undefined : targetType;
  const { data, isLoading, error } = useAdminReports(
    statusFilter,
    targetTypeFilter,
    limit,
    page * limit
  );
  const reportAction = useAdminReportAction();
  const updateReport = useUpdateAdminReport();

  const handleAction = async (
    id: string,
    action: "dismiss" | "resolve" | "take_down" | "warn_user" | "ban_user"
  ) => {
    if (
      (action === "take_down" || action === "ban_user") &&
      !confirm("This action is destructive. Are you sure?")
    ) {
      return;
    }
    try {
      await reportAction.mutateAsync({ id, action });
      toast.success("Action applied");
    } catch {
      toast.error("Failed to apply action");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="mb-2 h-10 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="mb-6 flex gap-4">
              <Skeleton className="h-12 flex-1" />
              <Skeleton className="h-12 w-40" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-4">
        <div className="flex size-20 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertTriangle className="size-10 text-destructive" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-semibold">Error loading reports</h3>
          <p className="mt-2 text-sm text-muted-foreground">Please try refreshing the page</p>
        </div>
        <Button onClick={() => window.location.reload()}>Refresh</Button>
      </div>
    );
  }

  const reports = data?.reports ?? [];
  const hasMore = data?.hasMore ?? false;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="mt-2 text-muted-foreground">User and content reports</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v ?? "all");
                setPage(0);
              }}
            >
              <SelectTrigger className="h-12 w-44">
                <Filter className="mr-2 size-4 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={targetType}
              onValueChange={(v) => {
                setTargetType(v ?? "all");
                setPage(0);
              }}
            >
              <SelectTrigger className="h-12 w-44">
                <SelectValue placeholder="Target type" />
              </SelectTrigger>
              <SelectContent>
                {TARGET_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Report list</CardTitle>
              <CardDescription>Showing {reports.length} reports</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="p-4 text-left text-sm font-semibold">Reporter</th>
                  <th className="p-4 text-left text-sm font-semibold">Target</th>
                  <th className="p-4 text-left text-sm font-semibold">Reason</th>
                  <th className="p-4 text-left text-sm font-semibold">Status</th>
                  <th className="p-4 text-left text-sm font-semibold">Created</th>
                  <th className="p-4 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reports.length > 0 ? (
                  reports.map((report: Report & { reporterUsername?: string | null; reporterName?: string | null; targetDisplayName?: string | null }) => (
                    <tr key={report.id} className="transition-colors hover:bg-accent/30">
                      <td className="p-4">
                        <span className="text-sm">
                          {report.reporterName ?? report.reporterUsername ?? "—"}
                        </span>
                        {report.reporterUsername && (
                          <span className="ml-1 text-xs text-muted-foreground">@{report.reporterUsername}</span>
                        )}
                      </td>
                      <td className="p-4">
                        <Link
                          to={targetLink(report)}
                          className="text-primary hover:underline"
                        >
                          {report.targetDisplayName
                            ? `${report.targetType} / ${report.targetDisplayName}`
                            : `${report.targetType} / ${report.targetId.slice(0, 8)}…`}
                        </Link>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary">{REASON_LABELS[report.reason] ?? report.reason}</Badge>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={
                            report.status === "pending"
                              ? "destructive"
                              : report.status === "resolved"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {report.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => updateReport.mutate({ id: report.id, data: { status: "reviewing" } })}
                            >
                              <Eye className="mr-2 size-4" />
                              Mark reviewing
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction(report.id, "dismiss")}>
                              <XCircle className="mr-2 size-4" />
                              Dismiss
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction(report.id, "resolve")}>
                              <CheckCircle className="mr-2 size-4" />
                              Resolve
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleAction(report.id, "take_down")}
                              className="text-destructive"
                            >
                              <FileWarning className="mr-2 size-4" />
                              Take down content
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction(report.id, "warn_user")}>
                              <MessageSquareWarning className="mr-2 size-4" />
                              Warn user
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleAction(report.id, "ban_user")}
                              className="text-destructive"
                            >
                              <Ban className="mr-2 size-4" />
                              Ban user
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-muted-foreground">
                      <Flag className="mx-auto mb-2 size-10 opacity-50" />
                      <p>No reports match your filters.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {page + 1}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasMore}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
