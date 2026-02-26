"use client";

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useGist, useGistComments, useCreateGistComment, useToggleGistStar, useIsGistStarred, useForkGist } from "@sigmagit/hooks";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CodeViewer } from "@/components/code-viewer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, GitFork, Edit, Trash2, Send } from "lucide-react";
import { timeAgo, getLanguage } from "@sigmagit/lib";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_main/gists/$id")({
  component: GistDetailPage,
});

function GistDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: gist, isLoading } = useGist(id);
  const { data: commentsData } = useGistComments(id);
  const { data: starredData } = useIsGistStarred(id);
  const createComment = useCreateGistComment();
  const toggleStar = useToggleGistStar();
  const forkGist = useForkGist();
  const [commentBody, setCommentBody] = useState("");

  const comments = commentsData?.comments || [];
  const isStarred = starredData?.starred || false;

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted" />
          <div className="h-32 bg-muted" />
        </div>
      </div>
    );
  }

  if (!gist) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Gist not found</h3>
          <p className="text-muted-foreground mb-6">The gist you're looking for doesn't exist.</p>
          <Link to="/gists">
            <Button variant="outline">Back to gists</Button>
          </Link>
        </div>
      </div>
    );
  }

  function handleStar() {
    toggleStar.mutate(id, {
      onSuccess: () => {
        // Query will auto-update
      },
    });
  }

  function handleFork() {
    forkGist.mutate(id, {
      onSuccess: (data) => {
        toast.success("Gist forked!");
        if (data?.id) {
          navigate({ to: "/gists/$id", params: { id: data.id } });
        }
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to fork gist");
      },
    });
  }

  function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!commentBody.trim()) return;

    createComment.mutate(
      { id, body: commentBody },
      {
        onSuccess: () => {
          setCommentBody("");
          toast.success("Comment added");
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to add comment");
        },
      }
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-2">
            {gist.description || (gist.files?.[0]?.filename || "Untitled gist")}
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Created {timeAgo(gist.createdAt)}</span>
            {gist.updatedAt !== gist.createdAt && <span>Updated {timeAgo(gist.updatedAt)}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleStar} className="gap-2" disabled={toggleStar.isPending}>
            <Star className={`size-4 ${isStarred ? "fill-yellow-400 text-yellow-400" : ""}`} />
            Star
          </Button>
          <Button variant="outline" size="sm" onClick={handleFork} className="gap-2" disabled={forkGist.isPending}>
            <GitFork className="size-4" />
            Fork
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {gist.files?.map((file) => {
          const language = file.language || getLanguage(file.filename);
          return (
            <div key={file.id} className="border border-border bg-card rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
                <span className="text-sm font-medium">{file.filename}</span>
                {language && language !== "plaintext" && (
                  <span className="text-xs text-muted-foreground">{language}</span>
                )}
              </div>
              <CodeViewer content={file.content} language={language} />
            </div>
          );
        })}
      </div>

      <div className="border border-border bg-card rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold">Comments</h2>

        <form onSubmit={handleCommentSubmit} className="space-y-3">
          <Textarea
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            placeholder="Leave a comment..."
            rows={4}
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" className="gap-2" disabled={createComment.isPending || !commentBody.trim()}>
              <Send className="size-4" />
              {createComment.isPending ? "Posting..." : "Comment"}
            </Button>
          </div>
        </form>

        <div className="space-y-4 pt-4">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No comments yet</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback>{(comment as any).author?.name?.charAt(0) || "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{(comment as any).author?.name || "Unknown"}</span>
                    <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
