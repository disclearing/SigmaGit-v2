"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useCreateMigration } from "@sigmagit/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Github, Gitlab, Link as LinkIcon, Globe, Lock, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_main/new/import/")({
  component: ImportRepositoryPage,
});

function ImportRepositoryPage() {
  const navigate = useNavigate();
  const createMigration = useCreateMigration();
  const [formData, setFormData] = useState({
    source: "url" as "github" | "gitlab" | "bitbucket" | "url",
    sourceUrl: "",
    sourceOwner: "",
    sourceRepo: "",
    name: "",
    description: "",
    visibility: "public" as "public" | "private",
    importIssues: false,
    importPRs: false,
    importLabels: false,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const sourceUrl = formData.source === "url" 
      ? formData.sourceUrl 
      : `https://${formData.source}.com/${formData.sourceOwner}/${formData.sourceRepo}.git`;

    createMigration.mutate(
      {
        source: formData.source,
        sourceUrl,
        sourceOwner: formData.sourceOwner || undefined,
        sourceRepo: formData.sourceRepo || undefined,
        options: {
          importIssues: formData.importIssues,
          importPRs: formData.importPRs,
          importLabels: formData.importLabels,
        },
      },
      {
        onSuccess: (data) => {
          toast.success("Migration started!");
          navigate({
            to: "/settings/migrations",
          });
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to start migration");
        },
      }
    );
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Import a repository</h1>
        <p className="text-muted-foreground">Import an existing repository from GitHub, GitLab, Bitbucket, or any Git URL</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="source" className="text-sm font-semibold">
            Source <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.source}
            onValueChange={(value) => setFormData({ ...formData, source: value as any })}
          >
            <SelectTrigger id="source" className="h-10">
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="url">
                <div className="flex items-center gap-2">
                  <LinkIcon className="size-4" />
                  <span>Git URL</span>
                </div>
              </SelectItem>
              <SelectItem value="github">
                <div className="flex items-center gap-2">
                  <Github className="size-4" />
                  <span>GitHub</span>
                </div>
              </SelectItem>
              <SelectItem value="gitlab">
                <div className="flex items-center gap-2">
                  <Gitlab className="size-4" />
                  <span>GitLab</span>
                </div>
              </SelectItem>
              <SelectItem value="bitbucket">
                <div className="flex items-center gap-2">
                  <Download className="size-4" />
                  <span>Bitbucket</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.source === "url" ? (
          <div className="space-y-2">
            <Label htmlFor="sourceUrl" className="text-sm font-semibold">
              Git URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="sourceUrl"
              value={formData.sourceUrl}
              onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
              placeholder="https://github.com/owner/repo.git"
              required
              className="h-10 bg-background"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">Enter the full Git repository URL</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sourceOwner" className="text-sm font-semibold">
                Owner/Username <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sourceOwner"
                value={formData.sourceOwner}
                onChange={(e) => setFormData({ ...formData, sourceOwner: e.target.value })}
                placeholder="owner"
                required
                className="h-10 bg-background"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sourceRepo" className="text-sm font-semibold">
                Repository <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sourceRepo"
                value={formData.sourceRepo}
                onChange={(e) => setFormData({ ...formData, sourceRepo: e.target.value })}
                placeholder="repo"
                required
                className="h-10 bg-background"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-semibold">
            Repository name <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Leave empty to use source repository name"
            className="h-10 bg-background"
          />
          <p className="text-xs text-muted-foreground">If left empty, the source repository name will be used</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-semibold">
            Description <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Repository description"
            className="h-10 bg-background"
          />
        </div>

        <div className="space-y-3 pt-4 border-t border-border">
          <Label className="text-sm font-semibold">Visibility</Label>
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={formData.visibility === "public"}
                onChange={() => setFormData({ ...formData, visibility: "public" })}
                className="mt-1.5 h-4 w-4 text-primary focus:ring-primary"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Globe className="size-4 text-muted-foreground" />
                  Public
                </div>
                <p className="text-xs text-muted-foreground mt-1">Anyone on the internet can see this repository.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="radio"
                name="visibility"
                value="private"
                checked={formData.visibility === "private"}
                onChange={() => setFormData({ ...formData, visibility: "private" })}
                className="mt-1.5 h-4 w-4 text-primary focus:ring-primary"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Lock className="size-4 text-muted-foreground" />
                  Private
                </div>
                <p className="text-xs text-muted-foreground mt-1">You choose who can see and commit to this repository.</p>
              </div>
            </label>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <Label className="text-sm font-semibold">Import options</Label>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="importIssues"
                checked={formData.importIssues}
                onCheckedChange={(checked) => setFormData({ ...formData, importIssues: checked })}
              />
              <Label htmlFor="importIssues" className="cursor-pointer text-sm font-normal">
                Import issues
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="importPRs"
                checked={formData.importPRs}
                onCheckedChange={(checked) => setFormData({ ...formData, importPRs: checked })}
              />
              <Label htmlFor="importPRs" className="cursor-pointer text-sm font-normal">
                Import pull requests
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="importLabels"
                checked={formData.importLabels}
                onCheckedChange={(checked) => setFormData({ ...formData, importLabels: checked })}
              />
              <Label htmlFor="importLabels" className="cursor-pointer text-sm font-normal">
                Import labels
              </Label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: "/" })}
            disabled={createMigration.isPending}
            className="h-10"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createMigration.isPending} className="h-10 px-6 text-sm font-semibold gap-2">
            {createMigration.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Download className="size-4" />
                Start import
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
