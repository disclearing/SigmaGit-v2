"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useCreateRelease, useRepoTags } from "@sigmagit/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_main/$username/$repo/releases/new")({
  component: NewReleasePage,
});

function NewReleasePage() {
  const { username, repo } = Route.useParams();
  const navigate = useNavigate();
  const createRelease = useCreateRelease();
  const { data: tagsData } = useRepoTags(username, repo);
  const tags = tagsData?.tags || [];

  const [formData, setFormData] = useState({
    tagName: "",
    name: "",
    body: "",
    isDraft: false,
    isPrerelease: false,
    targetCommitish: "main",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    createRelease.mutate(
      {
        owner: username,
        repo,
        tagName: formData.tagName,
        name: formData.name || formData.tagName,
        body: formData.body || undefined,
        isDraft: formData.isDraft,
        isPrerelease: formData.isPrerelease,
        targetCommitish: formData.targetCommitish,
      },
      {
        onSuccess: () => {
          toast.success("Release created!");
          navigate({
            to: "/$username/$repo/releases",
            params: { username, repo },
          });
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to create release");
        },
      }
    );
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create a new release</h1>
        <p className="text-muted-foreground mt-1">Create a new release to package your project</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="tagName">
            Tag name <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.tagName}
            onValueChange={(value) => {
              setFormData({ ...formData, tagName: value, name: value });
            }}
          >
            <SelectTrigger id="tagName">
              <SelectValue placeholder="Choose a tag or create a new one" />
            </SelectTrigger>
            <SelectContent>
              {tags.map((tag) => (
                <SelectItem key={tag.name} value={tag.name}>
                  {tag.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {tags.length === 0 && (
            <Input
              id="tagName"
              value={formData.tagName}
              onChange={(e) => {
                setFormData({ ...formData, tagName: e.target.value, name: e.target.value });
              }}
              placeholder="v1.0.0"
              required
              className="h-10 mt-2"
            />
          )}
          <p className="text-xs text-muted-foreground">Choose an existing tag or create a new one</p>
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

        <div className="space-y-2">
          <Label htmlFor="targetCommitish">Target branch</Label>
          <Input
            id="targetCommitish"
            value={formData.targetCommitish}
            onChange={(e) => setFormData({ ...formData, targetCommitish: e.target.value })}
            placeholder="main"
            className="h-10"
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

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: "/$username/$repo/releases", params: { username, repo } })}
            disabled={createRelease.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createRelease.isPending}>
            {createRelease.isPending ? "Creating..." : "Create release"}
          </Button>
        </div>
      </form>
    </div>
  );
}
