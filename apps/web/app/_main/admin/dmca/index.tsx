import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  useAdminDmcaRequests,
  useAdminDmcaRequest,
  useAdminDmcaAction,
  useUpdateAdminDmcaRequest,
} from "@sigmagit/hooks";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  MoreHorizontal,
  ShieldAlert,
  CheckCircle,
  Eye,
  XCircle,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DmcaRequest } from "@sigmagit/hooks";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "reviewing", label: "Reviewing" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "counter_filed", label: "Counter filed" },
];

export const Route = createFileRoute("/_main/admin/dmca/")({
  head: () => ({
    meta: [
      { title: "DMCA | Admin Panel | Sigmagit" },
      { name: "description", content: "Copyright takedown requests." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminDmca,
});

function AdminDmca() {
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(0);
  const [detailId, setDetailId] = useState<string | null>(null);
  const limit = 20;

  const statusFilter = status === "all" ? undefined : status;
  const { data, isLoading, error } = useAdminDmcaRequests(statusFilter, limit, page * limit);
  const { data: detailRequest } = useAdminDmcaRequest(detailId ?? "");
  const dmcaAction = useAdminDmcaAction();
  const updateDmca = useUpdateAdminDmcaRequest();

  const handleAction = async (
    id: string,
    action: "approve_takedown" | "reject" | "dismiss"
  ) => {
    if (action === "approve_takedown" && !confirm("Approve takedown and make content private. Continue?")) {
      return;
    }
    try {
      await dmcaAction.mutateAsync({ id, action });
      toast.success("Action applied");
      setDetailId(null);
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
          <h3 className="text-xl font-semibold">Error loading DMCA requests</h3>
          <p className="mt-2 text-sm text-muted-foreground">Please try refreshing the page</p>
        </div>
        <Button onClick={() => window.location.reload()}>Refresh</Button>
      </div>
    );
  }

  const requests = data?.requests ?? [];
  const hasMore = data?.hasMore ?? false;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">DMCA Requests</h1>
          <p className="mt-2 text-muted-foreground">Copyright takedown requests</p>
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Request list</CardTitle>
              <CardDescription>Showing {requests.length} requests</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="p-4 text-left text-sm font-semibold">Requester</th>
                  <th className="p-4 text-left text-sm font-semibold">Target</th>
                  <th className="p-4 text-left text-sm font-semibold">Copyright holder</th>
                  <th className="p-4 text-left text-sm font-semibold">Status</th>
                  <th className="p-4 text-left text-sm font-semibold">Filed</th>
                  <th className="p-4 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.length > 0 ? (
                  requests.map((req: DmcaRequest & { requesterUsername?: string | null; requesterName?: string | null; targetDisplayName?: string | null }) => (
                    <tr key={req.id} className="transition-colors hover:bg-accent/30">
                      <td className="p-4">
                        <span className="text-sm">{req.requesterName ?? req.requesterUsername ?? "—"}</span>
                        {req.requesterUsername && (
                          <span className="ml-1 text-xs text-muted-foreground">@{req.requesterUsername}</span>
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        {req.targetDisplayName
                          ? `${req.targetType} / ${req.targetDisplayName}`
                          : `${req.targetType} / ${req.targetId.slice(0, 8)}…`}
                      </td>
                      <td className="p-4 text-sm">{req.copyrightHolder}</td>
                      <td className="p-4">
                        <Badge
                          variant={
                            req.status === "pending"
                              ? "destructive"
                              : req.status === "approved"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {req.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(req.createdAt).toLocaleDateString()}
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
                            <DropdownMenuItem onClick={() => setDetailId(req.id)}>
                              <Eye className="mr-2 size-4" />
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                updateDmca.mutate({ id: req.id, data: { status: "reviewing" } })
                              }
                            >
                              Mark reviewing
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleAction(req.id, "approve_takedown")}
                              className="text-destructive"
                            >
                              <FileDown className="mr-2 size-4" />
                              Approve & take down
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction(req.id, "reject")}>
                              <XCircle className="mr-2 size-4" />
                              Reject
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction(req.id, "dismiss")}>
                              Dismiss
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-muted-foreground">
                      <ShieldAlert className="mx-auto mb-2 size-10 opacity-50" />
                      <p>No DMCA requests match your filters.</p>
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

      <Dialog open={!!detailId} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>DMCA request details</DialogTitle>
          </DialogHeader>
          {detailRequest && (
            <div className="space-y-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Copyright holder:</span>{" "}
                {detailRequest.copyrightHolder}
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Email:</span>{" "}
                {detailRequest.copyrightHolderEmail}
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Address:</span>{" "}
                {detailRequest.copyrightHolderAddress}
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Original work:</span>{" "}
                {detailRequest.originalWorkDescription}
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Infringing URLs:</span>{" "}
                <pre className="mt-1 whitespace-pre-wrap break-all rounded bg-muted p-2 text-xs">
                  {detailRequest.infringingUrls}
                </pre>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Description:</span>{" "}
                {detailRequest.description}
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Signature:</span>{" "}
                {detailRequest.signature}
              </div>
              {detailRequest.adminNotes && (
                <div>
                  <span className="font-medium text-muted-foreground">Admin notes:</span>{" "}
                  {detailRequest.adminNotes}
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => detailId && handleAction(detailId, "approve_takedown")}
                >
                  <CheckCircle className="mr-2 size-4" />
                  Approve & take down
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => detailId && handleAction(detailId, "reject")}
                >
                  Reject
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDetailId(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
