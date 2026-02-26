"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { usePublicGists } from "@sigmagit/hooks";
import { Button } from "@/components/ui/button";
import { FileCode2, Plus } from "lucide-react";
import { timeAgo } from "@sigmagit/lib";

export const Route = createFileRoute("/_main/gists/")({
  component: GistsPage,
});

function GistsPage() {
  const { data, isLoading } = usePublicGists(20, 0);
  const gists = data?.gists ?? [];

  return (
    <div className="container max-w-[1280px] mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gists</h1>
          <p className="text-muted-foreground mt-1">Discover and share code snippets</p>
        </div>
        <Link to="/gists/new">
          <Button className="gap-2">
            <Plus className="size-4" />
            New gist
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border border-border bg-card p-4 rounded-lg animate-pulse">
              <div className="h-4 w-32 bg-muted rounded mb-2" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : gists.length === 0 ? (
        <div className="border border-dashed border-border bg-muted/20 p-12 text-center rounded-lg">
          <FileCode2 className="size-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold mb-2">No gists yet</h3>
          <p className="text-muted-foreground mb-6">Be the first to share a code snippet</p>
          <Link to="/gists/new">
            <Button className="gap-2">
              <Plus className="size-4" />
              New gist
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gists.map((gist) => (
            <Link
              key={gist.id}
              to="/gists/$id"
              params={{ id: gist.id }}
              className="block border border-border bg-card rounded-lg p-4 hover:bg-muted/30 transition-colors"
            >
              <h3 className="font-semibold truncate mb-1">
                {gist.description || gist.files?.[0]?.filename || "Untitled gist"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {gist.files?.length ?? 0} {gist.files?.length === 1 ? "file" : "files"}
              </p>
              <p className="text-xs text-muted-foreground mt-3">Updated {timeAgo(gist.updatedAt)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
