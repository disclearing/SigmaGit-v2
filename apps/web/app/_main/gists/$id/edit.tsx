"use client";

import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useGist, useUpdateGist } from "@sigmagit/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, FileCode2, ArrowLeft, Globe, Lock, Code2 } from "lucide-react";
import { GIST_LANGUAGES } from "@/lib/gist-languages";
import { getLanguage } from "@sigmagit/lib";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* Back Link */}
      <Link to="/gists/$id" params={{ id }} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="size-4" />
        Back to gist
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="size-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
          <Code2 className="size-7" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Edit gist</h1>
          <p className="text-muted-foreground mt-1">Update your code snippet</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Info Card */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this gist about?"
                className="h-12"
              />
            </div>

            {/* Visibility Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Visibility</Label>
              <div className="grid sm:grid-cols-2 gap-3">
                <div
                  className={cn(
                    "relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                    visibility === "public"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30 hover:bg-accent/50"
                  )}
                  onClick={() => setVisibility("public")}
                >
                  <div className="size-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                    <Globe className="size-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="visibility"
                        value="public"
                        checked={visibility === "public"}
                        onChange={() => setVisibility("public")}
                        className="size-4"
                      />
                      <span className="font-semibold">Public</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Anyone can see this gist
                    </p>
                  </div>
                </div>

                <div
                  className={cn(
                    "relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                    visibility === "secret"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30 hover:bg-accent/50"
                  )}
                  onClick={() => setVisibility("secret")}
                >
                  <div className="size-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                    <Lock className="size-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="visibility"
                        value="secret"
                        checked={visibility === "secret"}
                        onChange={() => setVisibility("secret")}
                        className="size-4"
                      />
                      <span className="font-semibold">Secret</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Only you can see this gist
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Files Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Files</Label>
            <Button type="button" variant="outline" size="sm" onClick={addFile} className="gap-2">
              <Plus className="size-4" />
              Add file
            </Button>
          </div>

          {files.map((file, index) => (
            <Card key={file.id ?? index} className="overflow-hidden">
              <CardHeader className="py-4 px-6 bg-muted/50 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileCode2 className="size-5 text-muted-foreground" />
                    <CardTitle className="text-base">File {index + 1}</CardTitle>
                  </div>
                  {files.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-4" />
                      Remove
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`filename-${index}`} className="text-sm font-medium">Filename</Label>
                    <Input
                      id={`filename-${index}`}
                      value={file.filename}
                      onChange={(e) => updateFile(index, "filename", e.target.value)}
                      placeholder="example.js"
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`language-${index}`} className="text-sm font-medium">Language</Label>
                    <select
                      id={`language-${index}`}
                      value={file.language}
                      onChange={(e) => updateFile(index, "language", e.target.value)}
                      className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                <div className="space-y-2">
                  <Label htmlFor={`content-${index}`} className="text-sm font-medium">Content</Label>
                  <Textarea
                    id={`content-${index}`}
                    value={file.content}
                    onChange={(e) => updateFile(index, "content", e.target.value)}
                    placeholder="// Your code here..."
                    rows={12}
                    required
                    className="font-mono text-sm resize-y min-h-[200px]"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            size="lg"
            onClick={() => navigate({ to: "/gists/$id", params: { id } })}
            disabled={updateGist.isPending}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            size="lg"
            disabled={updateGist.isPending}
            className="gap-2"
          >
            {updateGist.isPending ? (
              <>Saving...</>
            ) : (
              <>
                <FileCode2 className="size-4" />
                Save changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
