import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAdminRepositories, useDeleteAdminRepository } from "@sigmagit/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_main/admin/repositories/")({
  component: AdminRepositories,
});

function AdminRepositories() {
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState<string>("");
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading, error } = useAdminRepositories(search, visibility, limit, page * limit);
  const deleteRepo = useDeleteAdminRepository();

  const handleDeleteRepo = async (repoId: string, repoName: string) => {
    if (confirm(`Are you sure you want to delete repository ${repoName}?`)) {
      await deleteRepo.mutateAsync(repoId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading repositories...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">Error loading repositories</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Repositories</h1>
        <p className="text-muted-foreground mt-2">Manage all platform repositories</p>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search repositories..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="max-w-xs"
        />
        <Select
          value={visibility}
          onValueChange={(value) => {
            setVisibility(value);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All visibility</SelectItem>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium">Repository</th>
              <th className="text-left p-4 font-medium">Owner</th>
              <th className="text-left p-4 font-medium">Visibility</th>
              <th className="text-left p-4 font-medium">Created</th>
              <th className="text-right p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.repositories?.map((repo) => (
              <tr key={repo.id} className="border-t border-border hover:bg-muted/30">
                <td className="p-4">
                  <div className="font-medium">{repo.name}</div>
                  <div className="text-sm text-muted-foreground">{repo.description}</div>
                </td>
                <td className="p-4 text-sm">{repo.ownerId}</td>
                <td className="p-4">
                  <Badge variant={repo.visibility === "public" ? "default" : "secondary"}>{repo.visibility}</Badge>
                </td>
                <td className="p-4 text-sm">{new Date(repo.createdAt).toLocaleDateString()}</td>
                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteRepo(repo.id, repo.name)}
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
