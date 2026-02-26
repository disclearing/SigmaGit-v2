"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useCreateGist } from "@sigmagit/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { GIST_LANGUAGES } from "@/lib/gist-languages";
import { getLanguage } from "@sigmagit/lib";

export const Route = createFileRoute("/_main/gists/new")({
  component: NewGistPage,
});

interface GistFile {
  filename: string;
  content: string;
  language: string;
}

function NewGistPage() {
  const navigate = useNavigate();
  const createGist = useCreateGist();

  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "secret">("public");
  const [files, setFiles] = useState<GistFile[]>([{ filename: "", content: "", language: "" }]);

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validFiles = files.filter((f) => f.filename.trim() && f.content.trim());
    if (validFiles.length === 0) {
      toast.error("At least one file with a filename and content is required");
      return;
    }

    createGist.mutate(
      {
        description: description.trim() || undefined,
        visibility,
        files: validFiles.map((f) => ({
          filename: f.filename,
          content: f.content,
          language: f.language || null,
        })),
      },
      {
        onSuccess: (data) => {
          toast.success("Gist created!");
          navigate({ to: "/gists/$id", params: { id: (data as any)?.id ?? "" } });
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to create gist");
        },
      }
    );
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create a new gist</h1>
        <p className="text-muted-foreground mt-1">Share code snippets, notes, and more</p>
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
            <div key={index} className="border border-border bg-card p-4 rounded-lg space-y-3">
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
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/gists" })} disabled={createGist.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={createGist.isPending}>
            {createGist.isPending ? "Creating..." : "Create gist"}
          </Button>
        </div>
      </form>
    </div>
  );
}
