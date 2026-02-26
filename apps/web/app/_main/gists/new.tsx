"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useCreateGist } from "@sigmagit/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_main/gists/new")({
  component: NewGistPage,
});

function NewGistPage() {
  const navigate = useNavigate();
  const createGist = useCreateGist();
  const [formData, setFormData] = useState({
    description: "",
    visibility: "public" as "public" | "secret",
    files: [{ filename: "", content: "" }],
  });

  function addFile() {
    setFormData({
      ...formData,
      files: [...formData.files, { filename: "", content: "" }],
    });
  }

  function removeFile(index: number) {
    setFormData({
      ...formData,
      files: formData.files.filter((_, i) => i !== index),
    });
  }

  function updateFile(index: number, field: "filename" | "content", value: string) {
    setFormData({
      ...formData,
      files: formData.files.map((file, i) => (i === index ? { ...file, [field]: value } : file)),
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validFiles = formData.files.filter((f) => f.filename && f.content);
    if (validFiles.length === 0) {
      toast.error("At least one file with a filename and content is required");
      return;
    }

    createGist.mutate(
      {
        description: formData.description || undefined,
        visibility: formData.visibility,
        files: validFiles,
      },
      {
        onSuccess: (data) => {
          toast.success("Gist created!");
          navigate({
            to: "/gists/$id",
            params: { id: data?.id || "" },
          });
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
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Gist description..."
            className="h-10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="visibility">Visibility</Label>
          <Select
            value={formData.visibility}
            onValueChange={(value) => setFormData({ ...formData, visibility: value as "public" | "secret" })}
          >
            <SelectTrigger id="visibility">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="secret">Secret</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Files</Label>
            <Button type="button" variant="outline" size="sm" onClick={addFile} className="gap-2">
              <Plus className="size-4" />
              Add file
            </Button>
          </div>

          {formData.files.map((file, index) => (
            <div key={index} className="border border-border bg-card p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor={`filename-${index}`}>Filename</Label>
                {formData.files.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="gap-2 text-destructive"
                  >
                    <Trash2 className="size-4" />
                    Remove
                  </Button>
                )}
              </div>
              <Input
                id={`filename-${index}`}
                value={file.filename}
                onChange={(e) => updateFile(index, "filename", e.target.value)}
                placeholder="example.js"
                className="h-10"
                required
              />
              <div className="space-y-2">
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

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: "/gists" })}
            disabled={createGist.isPending}
          >
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
