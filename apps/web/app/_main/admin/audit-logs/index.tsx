import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAdminAuditLogs } from "@sigmagit/hooks";
import { ChevronLeft, ChevronRight, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_main/admin/audit-logs/")({
  head: () => ({
    meta: [
      { title: "Audit Logs | Admin Panel | Sigmagit" },
      {
        name: "description",
        content: "View system audit logs, track administrative actions, and monitor platform activity.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Audit Logs | Admin Panel | Sigmagit" },
      {
        property: "og:description",
        content: "View system audit logs, track administrative actions, and monitor platform activity.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Audit Logs | Admin Panel | Sigmagit" },
      {
        name: "twitter:description",
        content: "View system audit logs, track administrative actions, and monitor platform activity.",
      },
    ],
  }),
  component: AdminAuditLogs,
});

function AdminAuditLogs() {
  const [action, setAction] = useState("");
  const [targetType, setTargetType] = useState("");
  const [page, setPage] = useState(0);
  const limit = 50;

  const { data, isLoading, error } = useAdminAuditLogs(action, targetType, limit, page * limit);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-40 mb-2" />
          <Skeleton className="h-5 w-56" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-64" />
        </div>
        <Card>
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-destructive text-lg font-semibold">Error loading audit logs</div>
        <p className="text-sm text-muted-foreground">Please try refreshing the page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground mt-2">Track system events and actions</p>
      </div>

      <Card>
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Filter by action..."
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(0);
              }}
              className="h-11 pl-9"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Filter by target type..."
              value={targetType}
              onChange={(e) => {
                setTargetType(e.target.value);
                setPage(0);
              }}
              className="h-11 pl-9"
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-semibold text-sm">Time</th>
                <th className="text-left p-4 font-semibold text-sm">Actor</th>
                <th className="text-left p-4 font-semibold text-sm">Action</th>
                <th className="text-left p-4 font-semibold text-sm">Target</th>
                <th className="text-left p-4 font-semibold text-sm">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {data?.logs && data.logs.length > 0 ? (
                data.logs.map((log) => (
                  <tr key={log.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        {log.actor ? (
                          <span className="font-medium">{log.actor.username}</span>
                        ) : (
                          <span className="text-muted-foreground">System</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="font-mono text-xs">{log.action}</Badge>
                    </td>
                    <td className="p-4 text-sm">
                      <div className="font-medium">{log.targetType}</div>
                      {log.targetId && (
                        <div className="text-muted-foreground text-xs mt-1 font-mono">{log.targetId}</div>
                      )}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground font-mono text-xs">
                      {log.ipAddress || "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="text-muted-foreground">No audit logs found</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {data && data.logs.length > 0 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="gap-2"
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page + 1}</span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => (data?.hasMore ? p + 1 : p))}
            disabled={!data?.hasMore}
            className="gap-2"
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
