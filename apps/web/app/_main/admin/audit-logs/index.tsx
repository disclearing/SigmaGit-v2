import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAdminAuditLogs } from "@sigmagit/hooks";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_main/admin/audit-logs/")({
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
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading audit logs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">Error loading audit logs</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground mt-2">Track system events and actions</p>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Filter by action..."
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(0);
          }}
          className="max-w-xs"
        />
        <Input
          placeholder="Filter by target type..."
          value={targetType}
          onChange={(e) => {
            setTargetType(e.target.value);
            setPage(0);
          }}
          className="max-w-xs"
        />
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium">Time</th>
              <th className="text-left p-4 font-medium">Actor</th>
              <th className="text-left p-4 font-medium">Action</th>
              <th className="text-left p-4 font-medium">Target</th>
              <th className="text-left p-4 font-medium">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {data?.logs?.map((log) => (
              <tr key={log.id} className="border-t border-border hover:bg-muted/30">
                <td className="p-4 text-sm">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="p-4">
                  <div className="text-sm">
                    {log.actor ? (
                      <span>{log.actor.username}</span>
                    ) : (
                      <span className="text-muted-foreground">System</span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <Badge variant="outline">{log.action}</Badge>
                </td>
                <td className="p-4 text-sm">
                  <div className="font-medium">{log.targetType}</div>
                  {log.targetId && <div className="text-muted-foreground">{log.targetId}</div>}
                </td>
                <td className="p-4 text-sm text-muted-foreground">{log.ipAddress || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <button
          className="px-4 py-2 border border-border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          Previous
        </button>
        <span className="text-sm text-muted-foreground">Page {page + 1}</span>
        <button
          className="px-4 py-2 border border-border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => setPage((p) => (data?.hasMore ? p + 1 : p))}
          disabled={!data?.hasMore}
        >
          Next
        </button>
      </div>
    </div>
  );
}
