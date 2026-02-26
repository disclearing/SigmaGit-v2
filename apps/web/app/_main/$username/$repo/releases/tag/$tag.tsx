"use client";

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useReleaseByTag, useReleaseAssets, useDeleteRelease } from "@sigmagit/hooks";
import { Button } from "@/components/ui/button";
import { Package, Download, Trash2, Edit } from "lucide-react";
import { timeAgo } from "@sigmagit/lib";
import { toast } from "sonner";
import { Markdown } from "@/components/markdown";

export const Route = createFileRoute("/_main/$username/$repo/releases/tag/$tag")({
  component: ReleaseDetailPage,
});

function ReleaseDetailPage() {
  const { username, repo, tag } = Route.useParams();
  const navigate = useNavigate();
  const { data: release, isLoading } = useReleaseByTag(username, repo, tag);
  const { data: assetsData } = useReleaseAssets(username, repo, release?.id || "");
  const deleteRelease = useDeleteRelease();

  const assets = assetsData?.assets || [];

  if (isLoading) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted" />
          <div className="h-4 w-32 bg-muted" />
          <div className="h-32 bg-muted" />
        </div>
      </div>
    );
  }

  if (!release) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-6">
        <div className="text-center py-12">
          <Package className="size-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold mb-2">Release not found</h3>
          <p className="text-muted-foreground mb-6">The release you're looking for doesn't exist.</p>
          <Link to="/$username/$repo/releases" params={{ username, repo }}>
            <Button variant="outline">Back to releases</Button>
          </Link>
        </div>
      </div>
    );
  }

  function handleDelete() {
    if (!confirm("Are you sure you want to delete this release? This action cannot be undone.")) {
      return;
    }

    deleteRelease.mutate(
      { owner: username, repo, id: release.id },
      {
        onSuccess: () => {
          toast.success("Release deleted");
          navigate({ to: "/$username/$repo/releases", params: { username, repo } });
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to delete release");
        },
      }
    );
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{release.name}</h1>
            <span className="px-2 py-1 text-sm font-medium bg-primary/10 text-primary rounded-full">
              {release.tagName}
            </span>
            {release.isPrerelease && (
              <span className="px-2 py-1 text-sm font-medium bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-full">
                Pre-release
              </span>
            )}
            {release.isDraft && (
              <span className="px-2 py-1 text-sm font-medium bg-muted text-muted-foreground rounded-full">
                Draft
              </span>
            )}
          </div>
          <p className="text-muted-foreground">
            Published {timeAgo(release.publishedAt || release.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/$username/$repo/releases/$id/edit" params={{ username, repo, id: release.id }}>
            <Button variant="outline" size="sm" className="gap-2">
              <Edit className="size-4" />
              Edit
            </Button>
          </Link>
          <Button variant="destructive" size="sm" className="gap-2" onClick={handleDelete} disabled={deleteRelease.isPending}>
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </div>

      {release.body && (
        <div className="border border-border bg-card rounded-lg p-6">
          <Markdown content={release.body} />
        </div>
      )}

      {assets.length > 0 && (
        <div className="border border-border bg-card rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Assets</h2>
          <div className="space-y-2">
            {assets.map((asset) => (
              <div key={asset.id} className="flex items-center justify-between p-3 border border-border rounded">
                <div className="flex items-center gap-3">
                  <Package className="size-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{asset.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {(asset.size / 1024 / 1024).toFixed(2)} MB • {asset.downloadCount} downloads
                    </div>
                  </div>
                </div>
                <a
                  href={`/api/repositories/${username}/${repo}/releases/${release.id}/assets/${asset.id}`}
                  download
                >
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="size-4" />
                    Download
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
