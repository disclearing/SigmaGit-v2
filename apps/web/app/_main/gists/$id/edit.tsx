"use client";

import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useGist, useUpdateGist } from "@sigmagit/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { GIST_LANGUAGES } from "@/lib/gist-languages";
import { getLanguage } from "@sigmagit/lib";
import { useSession } from "@/lib/auth-client";

export const Route = createFileRoute("/_main/gists/$id/edit")({
  component: EditGistPage,
});

interface GistFile {
  id?: string;
  filename: string;
  content: string;
  language: string;
}

function EditGistPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: session } = useSession();
  const { data: gist, isLoading } = useGist(id);
  const updateGist = useUpdateGist();

  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "secret">("public");
  const [files, setFiles] = useState<GistFile[]>([]);

  useEffect(() => {
    if (gist) {
      setDescription((gist as any).description ?? "");
      setVisibility((gist as any).visibility ?? "public");
      const gistFiles = Array.isArray((gist as any).files) ? (gist as any).files : [];
      setFiles(
        gistFiles.map((f: any) => ({
          id: f.id,
          filename: f.filename ?? "",
          content: f.content ?? "",
          language: f.language ?? "",
        }))
      );
    }
  }, [gist]);

  function addFile() {
    setFiles((prev) => [...prev, { filename: "", content: "", language: "" }]);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function updateFile(index: number, field: keyof GistFile, value: string) {
    setFiles((prev) =>
      prev.map((file, i) => {
        if (i !== index) return file;
        const updated = { ...file, [field]: value };
        if (field === "filename" && !file.language && value) {
          const detected = getLanguage(value);
          if (detected !== "plaintext") updated.language = detected;
        }
        return updated;
      })
    );
  }

  if (isLoading) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-48 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!gist) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-6 text-center py-12">
        <h3 className="text-lg font-semibold mb-2">Gist not found</h3>
        <Link to="/gists">
          <Button variant="outline">Back to gists</Button>
        </Link>
      </div>
    );
  }

  const gistOwnerId = (gist as any).ownerId ?? (gist as any).owner?.id;
  const isOwner = !!(session?.user?.id && session.user.id === gistOwnerId);

  if (!isOwner) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-6 text-center py-12">
        <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
        <p className="text-muted-foreground mb-4">You don't have permission to edit this gist.</p>
        <Link to="/gists/$id" params={{ id }}>
          <Button variant="outline">View gist</Button>
        </Link>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validFiles = files.filter((f) => f.filename.trim() && f.content.trim());
    if (validFiles.length === 0) {
      toast.error("At least one file with a filename and content is required");
      return;
    }

    updateGist.mutate(
      {
        id,
        body: {
          description: description.trim() || undefined,
          visibility,
          files: validFiles.map((f) => ({
            id: f.id,
            filename: f.filename,
            content: f.content,
            language: f.language || null,
          })),
        },
      },
      {
        onSuccess: () => {
          toast.success("Gist updated!");
          navigate({ to: "/gists/$id", params: { id } });
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to update gist");
        },
      }
    );
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit gist</h1>
        <p className="text-muted-foreground mt-1">Update your code snippet</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Gist description..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="visibility">Visibility</Label>
          <select
            id="visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as "public" | "secret")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="public">Public</option>
            <option value="secret">Secret</option>
          </select>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Files</Label>
            <Button type="button" variant="outline" size="sm" onClick={addFile} className="gap-2">
              <Plus className="size-4" />
              Add file
            </Button>
          </div>

          {files.map((file, index) => (
            <div key={file.id ?? index} className="border border-border bg-card p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Label>File {index + 1}</Label>
                {files.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                    Remove
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor={`filename-${index}`}>Filename</Label>
                  <Input
                    id={`filename-${index}`}
                    value={file.filename}
                    onChange={(e) => updateFile(index, "filename", e.target.value)}
                    placeholder="example.js"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`language-${index}`}>Language</Label>
                  <select
                    id={`language-${index}`}
                    value={file.language}
                    onChange={(e) => updateFile(index, "language", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Auto-detect</option>
                    {GIST_LANGUAGES.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor={`content-${index}`}>Content</Label>
                <Textarea
                  id={`content-${index}`}
                  value={file.content}
                  onChange={(e) => updateFile(index, "content", e.target.value)}
                  placeholder="// Your code here..."
                  rows={10}
                  required
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: "/gists/$id", params: { id } })}
            disabled={updateGist.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateGist.isPending}>
            {updateGist.isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
