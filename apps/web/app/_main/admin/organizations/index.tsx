import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAdminOrganizations, useDeleteAdminOrganization } from "@sigmagit/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

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
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading organizations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">Error loading organizations</div>
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
        <Input
          placeholder="Search organizations..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="max-w-xs"
        />
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium">Organization</th>
              <th className="text-left p-4 font-medium">Name</th>
              <th className="text-left p-4 font-medium">Verified</th>
              <th className="text-left p-4 font-medium">Created</th>
              <th className="text-right p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.organizations?.map((org) => (
              <tr key={org.id} className="border-t border-border hover:bg-muted/30">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={org.avatarUrl || undefined} />
                      <AvatarFallback>{org.displayName.charAt(0)}</AvatarFallback>
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
                    <Badge variant="default">Verified</Badge>
                  ) : (
                    <Badge variant="secondary">Unverified</Badge>
                  )}
                </td>
                <td className="p-4 text-sm">{new Date(org.createdAt).toLocaleDateString()}</td>
                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteOrg(org.id, org.name)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">Page {page + 1}</span>
        <Button variant="outline" onClick={() => setPage((p) => (data?.hasMore ? p + 1 : p))} disabled={!data?.hasMore}>
          Next
        </Button>
      </div>
    </div>
  );
}
