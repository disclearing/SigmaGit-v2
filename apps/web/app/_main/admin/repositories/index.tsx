import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAdminRepositories, useDeleteAdminRepository } from "@sigmagit/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronLeft, ChevronRight, Trash2, Globe, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_main/admin/repositories/")({
  head: () => ({
    meta: [
      { title: "Repositories | Admin Panel | Sigmagit" },
      {
        name: "description",
        content: "Manage all platform repositories, visibility settings, and repository transfers.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Repositories | Admin Panel | Sigmagit" },
      {
        property: "og:description",
        content: "Manage all platform repositories, visibility settings, and repository transfers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Repositories | Admin Panel | Sigmagit" },
      {
        name: "twitter:description",
        content: "Manage all platform repositories, visibility settings, and repository transfers.",
      },
    ],
  }),
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
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-40 mb-2" />
          <Skeleton className="h-5 w-56" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
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
        <div className="text-destructive text-lg font-semibold">Error loading repositories</div>
        <p className="text-sm text-muted-foreground">Please try refreshing the page</p>
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
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search repositories..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={visibility}
          onValueChange={(value) => {
            setVisibility(value || "");
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

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-semibold text-sm">Repository</th>
                <th className="text-left p-4 font-semibold text-sm">Owner</th>
                <th className="text-left p-4 font-semibold text-sm">Visibility</th>
                <th className="text-left p-4 font-semibold text-sm">Created</th>
                <th className="text-right p-4 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.repositories && data.repositories.length > 0 ? (
                data.repositories.map((repo) => (
                  <tr key={repo.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium">{repo.name}</div>
                      {repo.description && (
                        <div className="text-sm text-muted-foreground mt-1 line-clamp-1">{repo.description}</div>
                      )}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{repo.ownerId}</td>
                    <td className="p-4">
                      <Badge variant={repo.visibility === "public" ? "default" : "secondary"} className="gap-1.5">
                        {repo.visibility === "public" ? (
                          <Globe className="size-3" />
                        ) : (
                          <Lock className="size-3" />
                        )}
                        {repo.visibility}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(repo.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteRepo(repo.id, repo.name)}
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
                    <div className="text-muted-foreground">No repositories found</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {data && data.repositories.length > 0 && (
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
