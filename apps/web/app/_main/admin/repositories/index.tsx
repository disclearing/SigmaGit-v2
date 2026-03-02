import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAdminRepositories, useDeleteAdminRepository } from "@sigmagit/hooks";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Filter,
  FolderGit2,
  GitBranch,
  Globe,
  Lock,
  MoreHorizontal,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";

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
  const [visibility, setVisibility] = useState<string>("all");
  const [page, setPage] = useState(0);
  const limit = 20;

  const visibilityFilter = visibility === "all" ? undefined : visibility;
  const { data, isLoading, error } = useAdminRepositories(search, visibilityFilter, limit, page * limit);
  const deleteRepo = useDeleteAdminRepository();

  const handleDeleteRepo = async (repoId: string, repoName: string) => {
    if (confirm(`Are you sure you want to delete repository "${repoName}"? This action cannot be undone.`)) {
      try {
      await deleteRepo.mutateAsync(repoId);
        toast.success(`Repository "${repoName}" deleted`);
      } catch {
        toast.error("Failed to delete repository");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4 mb-6">
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
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="size-20 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="size-10 text-destructive" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-semibold">Error loading repositories</h3>
          <p className="text-sm text-muted-foreground mt-2">Please try refreshing the page</p>
        </div>
        <Button onClick={() => window.location.reload()}>Refresh</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Repositories</h1>
          <p className="text-muted-foreground mt-2">
            Manage {data?.repositories?.length || 0} platform repositories
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search repositories..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
                className="pl-10 h-12"
          />
        </div>
        <Select
          value={visibility}
          onValueChange={(value) => {
            setVisibility(value ?? "all");
            setPage(0);
          }}
        >
              <SelectTrigger className="w-44 h-12">
                <Filter className="size-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="All visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All visibility</SelectItem>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>
      </div>
        </CardContent>
      </Card>

      {/* Repositories Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Repository List</CardTitle>
              <CardDescription>
                Showing {data?.repositories?.length || 0} repositories
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
                <tr className="bg-muted/50 border-b border-border">
                <th className="text-left p-4 font-semibold text-sm">Repository</th>
                <th className="text-left p-4 font-semibold text-sm">Owner</th>
                <th className="text-left p-4 font-semibold text-sm">Visibility</th>
                <th className="text-left p-4 font-semibold text-sm">Created</th>
                <th className="text-right p-4 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
              <tbody className="divide-y divide-border">
              {data?.repositories && data.repositories.length > 0 ? (
                data.repositories.map((repo) => (
                    <tr key={repo.id} className="hover:bg-accent/30 transition-colors">
                    <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-muted">
                            <GitBranch className="size-4 text-muted-foreground" />
                          </div>
                          <div>
                      <div className="font-medium">{repo.name}</div>
                      {repo.description && (
                              <div className="text-sm text-muted-foreground mt-0.5 line-clamp-1 max-w-xs">
                                {repo.description}
                              </div>
                      )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                            {repo.ownerId.charAt(0)}
                          </div>
                          <span className="text-sm text-muted-foreground">{repo.ownerId}</span>
                        </div>
                    </td>
                    <td className="p-4">
                        <Badge
                          variant="outline"
                          className={cn(
                            "gap-1.5 font-medium",
                            repo.visibility === "public"
                              ? "bg-green-500/10 text-green-600 border-green-500/20"
                              : "bg-orange-500/10 text-orange-600 border-orange-500/20"
                          )}
                        >
                        {repo.visibility === "public" ? (
                          <Globe className="size-3" />
                        ) : (
                          <Lock className="size-3" />
                        )}
                        {repo.visibility}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                        {new Date(repo.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                          <a 
                            href={`/${repo.ownerId}/${repo.name}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
                          >
                            <ExternalLink className="size-4" />
                          </a>
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Button variant="ghost" size="icon" className="size-9">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-48">
                              <a 
                                href={`/${repo.ownerId}/${repo.name}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground gap-2"
                              >
                                <ExternalLink className="size-4" />
                                View Repository
                              </a>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                          onClick={() => handleDeleteRepo(repo.id, repo.name)}
                                className="text-destructive focus:text-destructive gap-2"
                        >
                                <Trash2 className="size-4" />
                                Delete Repository
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                          <FolderGit2 className="size-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">No repositories found</p>
                          <p className="text-sm text-muted-foreground">
                            Try adjusting your search or filters
                          </p>
                        </div>
                      </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </CardContent>
      </Card>

      {/* Pagination */}
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
          <span className="text-sm text-muted-foreground">
            Page {page + 1}
            {data?.hasMore && " of more"}
          </span>
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
