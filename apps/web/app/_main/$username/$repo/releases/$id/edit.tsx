"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Package, Trash2, Upload } from "lucide-react";
import { useRelease, useReleaseAssets, useRepoTags, useUpdateRelease, useUploadReleaseAsset, useDeleteReleaseAsset } from "@sigmagit/hooks";
import { getApiUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_main/$username/$repo/releases/$id/edit")({
  component: EditReleasePage,
});

function EditReleasePage() {
  const { username, repo, id } = Route.useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: release, isLoading } = useRelease(username, repo, id);
  const { data: assetsData } = useReleaseAssets(username, repo, id);
  const assets = assetsData?.assets ?? [];
  const updateRelease = useUpdateRelease();
  const uploadAsset = useUploadReleaseAsset();
  const deleteAsset = useDeleteReleaseAsset();
  const { data: tagsData } = useRepoTags(username, repo);
  const tags = tagsData?.tags || [];

  const [formData, setFormData] = useState({
    name: "",
    body: "",
    isDraft: false,
    isPrerelease: false,
  });

  useEffect(() => {
    if (release) {
      setFormData({
        name: release.name,
        body: release.body || "",
        isDraft: release.isDraft,
        isPrerelease: release.isPrerelease,
      });
    }
  }, [release]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    updateRelease.mutate(
      {
        owner: username,
        repo,
        id,
        name: formData.name,
        body: formData.body || undefined,
        isDraft: formData.isDraft,
      },
      {
        onSuccess: () => {
          toast.success("Release updated!");
          navigate({
            to: "/$username/$repo/releases/tag/$tag",
            params: { username, repo, tag: release?.tagName || "" },
          });
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to update release");
        },
      }
    );
  }

  function handleUploadAsset(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadAsset.mutate(
      { owner: username, repo, id, file },
      {
        onSuccess: () => {
          toast.success(`${file.name} uploaded`);
          e.target.value = "";
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to upload asset");
        },
      }
    );
  }

  function handleDeleteAsset(assetId: string) {
    deleteAsset.mutate(
      { owner: username, repo, id, assetId },
      {
        onSuccess: () => toast.success("Asset removed"),
        onError: () => toast.error("Failed to remove asset"),
      }
    );
  }

  const apiUrl = getApiUrl();

  if (isLoading) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted" />
          <div className="h-32 bg-muted" />
        </div>
      </div>
    );
  }

  if (!release) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Release not found</h3>
          <p className="text-muted-foreground mb-6">The release you're looking for doesn't exist.</p>
          <Button variant="outline" onClick={() => navigate({ to: "/$username/$repo/releases", params: { username, repo } })}>
            Back to releases
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit release</h1>
        <p className="text-muted-foreground mt-1">Update release information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="tagName">Tag</Label>
          <Input
            id="tagName"
            value={release.tagName}
            disabled
            className="h-10 bg-muted"
          />
          <p className="text-xs text-muted-foreground">Tag name cannot be changed</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">
            Release title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Release v1.0.0"
            required
            className="h-10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="body">Release notes</Label>
          <Textarea
            id="body"
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            placeholder="Describe what's new in this release..."
            rows={10}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDraft"
              checked={formData.isDraft}
              onCheckedChange={(checked) => setFormData({ ...formData, isDraft: checked })}
            />
            <Label htmlFor="isDraft" className="cursor-pointer">
              Save as draft
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPrerelease"
              checked={formData.isPrerelease}
              onCheckedChange={(checked) => setFormData({ ...formData, isPrerelease: checked })}
            />
            <Label htmlFor="isPrerelease" className="cursor-pointer">
              This is a pre-release
            </Label>
          </div>
        </div>

        <div className="space-y-4 border border-border rounded-lg p-4">
          <h3 className="font-medium flex items-center gap-2">
            <Package className="size-4" />
            Release assets
          </h3>
          {assets.length > 0 && (
            <ul className="space-y-2">
              {assets.map((asset) => (
                <li
                  key={asset.id}
                  className="flex items-center justify-between gap-4 p-3 border border-border rounded-md bg-muted/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Package className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{asset.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {(Number(asset.size) / 1024 / 1024).toFixed(2)} MB
                        {asset.downloadCount > 0 && ` • ${asset.downloadCount} downloads`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {apiUrl && (
                      <a
                        href={`${apiUrl}/api/repositories/${username}/${repo}/releases/${id}/assets/${asset.id}`}
                        download
                      >
                        <Button type="button" variant="outline" size="sm" className="gap-1">
                          <Download className="size-4" />
                          Download
                        </Button>
                      </a>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteAsset(asset.id)}
                      disabled={deleteAsset.isPending}
                    >
                      <Trash2 className="size-4" />
                      Remove
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleUploadAsset}
              disabled={uploadAsset.isPending}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadAsset.isPending}
            >
              <Upload className="size-4" />
              {uploadAsset.isPending ? "Uploading..." : "Upload asset"}
            </Button>
            <span className="text-sm text-muted-foreground">Max 100MB per file</span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: "/$username/$repo/releases/tag/$tag", params: { username, repo, tag: release.tagName } })}
            disabled={updateRelease.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateRelease.isPending}>
            {updateRelease.isPending ? "Updating..." : "Update release"}
          </Button>
        </div>
      </form>
    </div>
  );
}
