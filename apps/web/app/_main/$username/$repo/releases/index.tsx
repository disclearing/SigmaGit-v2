"use client";

import { Link, createFileRoute } from "@tanstack/react-router";
import { useReleases } from "@sigmagit/hooks";
import { Package, Plus } from "lucide-react";
import { timeAgo } from "@sigmagit/lib";
import { createMeta } from "@/lib/seo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_main/$username/$repo/releases/")({
  head: ({ params }) => ({
    meta: createMeta({
      title: `${params.username}/${params.repo} · Releases`,
      description: `Releases and tags for ${params.username}/${params.repo} on Sigmagit.`,
    }),
  }),
  component: ReleasesPage,
});

function ReleasesPage() {
  const { username, repo } = Route.useParams();
  const { data, isLoading } = useReleases(username, repo, false);

  const releases = data?.releases || [];

  return (
    <div className="container max-w-[1280px] mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Releases</h1>
          <p className="text-muted-foreground mt-1">Manage releases for this repository</p>
        </div>
        <Link to="/$username/$repo/releases/new" params={{ username, repo }}>
          <Button className="gap-2">
            <Plus className="size-4" />
            Create a new release
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border border-border bg-card p-6 animate-pulse">
              <div className="h-6 w-48 bg-muted mb-2" />
              <div className="h-4 w-32 bg-muted" />
            </div>
          ))}
        </div>
      ) : releases.length === 0 ? (
        <div className="border border-dashed border-border bg-muted/20 p-12 text-center rounded-lg">
          <Package className="size-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold mb-2">No releases yet</h3>
          <p className="text-muted-foreground mb-6">Create your first release to package and share your project</p>
          <Link to="/$username/$repo/releases/new" params={{ username, repo }}>
            <Button className="gap-2">
              <Plus className="size-4" />
              Create a new release
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {releases.map((release) => (
            <Link
              key={release.id}
              to="/$username/$repo/releases/tag/$tag"
              params={{ username, repo, tag: release.tagName }}
              className="block border border-border bg-card rounded-lg p-6 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{release.name}</h3>
                    <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                      {release.tagName}
                    </span>
                    {release.isPrerelease && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-full">
                        Pre-release
                      </span>
                    )}
                    {release.isDraft && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full">
                        Draft
                      </span>
                    )}
                  </div>
                  {release.body && (
                    <p className="text-muted-foreground line-clamp-2 mb-3">{release.body}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Published {timeAgo(release.publishedAt || release.createdAt)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
