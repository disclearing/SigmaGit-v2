import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAdminOrganizations, useDeleteAdminOrganization } from "@sigmagit/hooks";
import { CheckCircle2, ChevronLeft, ChevronRight, Search, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_main/admin/organizations/")({
  head: () => ({
    meta: [
      { title: "Organizations | Admin Panel | Sigmagit" },
      {
        name: "description",
        content: "Manage platform organizations, members, and organization settings.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Organizations | Admin Panel | Sigmagit" },
      {
        property: "og:description",
        content: "Manage platform organizations, members, and organization settings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Organizations | Admin Panel | Sigmagit" },
      {
        name: "twitter:description",
        content: "Manage platform organizations, members, and organization settings.",
      },
    ],
  }),
  component: AdminOrganizations,
});

function AdminOrganizations() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading, error } = useAdminOrganizations(search, limit, page * limit);
  const deleteOrg = useDeleteAdminOrganization();

  const handleDeleteOrg = async (orgId: string, orgName: string) => {
    if (confirm(`Are you sure you want to delete organization ${orgName}? This action cannot be undone.`)) {
      await deleteOrg.mutateAsync(orgId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="flex gap-4">
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
        <div className="text-destructive text-lg font-semibold">Error loading organizations</div>
        <p className="text-sm text-muted-foreground">Please try refreshing the page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
        <p className="text-muted-foreground mt-2">Manage platform organizations</p>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-semibold text-sm">Organization</th>
                <th className="text-left p-4 font-semibold text-sm">Display Name</th>
                <th className="text-left p-4 font-semibold text-sm">Verified</th>
                <th className="text-left p-4 font-semibold text-sm">Created</th>
                <th className="text-right p-4 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.organizations && data.organizations.length > 0 ? (
                data.organizations.map((org) => (
                  <tr key={org.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={org.avatarUrl || undefined} />
                          <AvatarFallback className="text-sm">{org.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{org.displayName}</div>
                          <div className="text-sm text-muted-foreground">@{org.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm">{org.displayName}</td>
                    <td className="p-4">
                      {org.isVerified ? (
                        <Badge variant="default" className="gap-1.5">
                          <CheckCircle2 className="size-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1.5">
                          <XCircle className="size-3" />
                          Unverified
                        </Badge>
                      )}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteOrg(org.id, org.name)}
                          className="gap-2"
                        >
                          <Trash2 className="size-3" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="text-muted-foreground">No organizations found</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {data && data.organizations.length > 0 && (
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
