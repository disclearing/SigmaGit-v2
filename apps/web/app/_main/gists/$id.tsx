"use client";

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  useGist,
  useGistComments,
  useCreateGistComment,
  useToggleGistStar,
  useIsGistStarred,
  useForkGist,
  useDeleteGist,
} from "@sigmagit/hooks";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CodeViewer } from "@/components/code-viewer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, GitFork, Edit, Trash2, Send } from "lucide-react";
import { timeAgo, getLanguage } from "@sigmagit/lib";
import { toast } from "sonner";
import { useState } from "react";
import { useSession } from "@/lib/auth-client";

export const Route = createFileRoute("/_main/gists/$id")({
  component: GistDetailPage,
});

function GistDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: session } = useSession();
  const { data: gist, isLoading } = useGist(id);
  const { data: commentsData } = useGistComments(id);
  const { data: starredData } = useIsGistStarred(id);
  const createComment = useCreateGistComment();
  const toggleStar = useToggleGistStar();
  const forkGist = useForkGist();
  const deleteGist = useDeleteGist();
  const [commentBody, setCommentBody] = useState("");

  const comments = commentsData?.comments ?? [];
  const isStarred = starredData?.starred ?? false;
  const isOwner = !!(session?.user?.id && gist && session.user.id === ((gist as any).ownerId ?? (gist as any).owner?.id));

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-48 bg-muted rounded" />
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

  const files = Array.isArray((gist as any).files) ? (gist as any).files : [];

  function handleDelete() {
    if (!confirm("Delete this gist? This cannot be undone.")) return;
    deleteGist.mutate(id, {
      onSuccess: () => {
        toast.success("Gist deleted");
        navigate({ to: "/gists" });
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to delete gist");
      },
    });
  }

  function handleFork() {
    forkGist.mutate(id, {
      onSuccess: (data) => {
        toast.success("Gist forked!");
        if ((data as any)?.id) navigate({ to: "/gists/$id", params: { id: (data as any).id } });
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to fork"),
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
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to add comment"),
      }
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">
            {(gist as any).description || files[0]?.filename || "Untitled gist"}
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            {(gist as any).owner && (
              <Link
                to="/profile/$username"
                params={{ username: (gist as any).owner.username }}
                className="hover:underline font-medium"
              >
                {(gist as any).owner.name || (gist as any).owner.username}
              </Link>
            )}
            <span>Created {timeAgo((gist as any).createdAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleStar.mutate(id)}
            className="gap-2"
            disabled={toggleStar.isPending}
          >
            <Star className={`size-4 ${isStarred ? "fill-yellow-400 text-yellow-400" : ""}`} />
            Star
          </Button>
          <Button variant="outline" size="sm" onClick={handleFork} className="gap-2" disabled={forkGist.isPending}>
            <GitFork className="size-4" />
            Fork
          </Button>
          {isOwner && (
            <>
              <Link to="/gists/$id/edit" params={{ id }}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Edit className="size-4" />
                  Edit
                </Button>
              </Link>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleteGist.isPending}
                className="gap-2"
              >
                <Trash2 className="size-4" />
                {deleteGist.isPending ? "Deleting..." : "Delete"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Files */}
      <div className="space-y-4">
        {files.length > 0 ? (
          files.map((file: any) => {
            const language = file.language || getLanguage(file.filename);
            return (
              <div key={file.id} className="border border-border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
                  <span className="text-sm font-mono font-medium">{file.filename}</span>
                  {language && language !== "plaintext" && (
                    <span className="text-xs text-muted-foreground capitalize">{language}</span>
                  )}
                </div>
                <CodeViewer content={file.content} language={language} />
              </div>
            );
          })
        ) : (
          <div className="border border-border rounded-lg p-8 text-center">
            <p className="text-muted-foreground">No files in this gist</p>
          </div>
        )}
      </div>

      {/* Comments */}
      <div className="border border-border rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold">Comments ({comments.length})</h2>

        <form onSubmit={handleCommentSubmit} className="space-y-3">
          <Textarea
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            placeholder="Leave a comment..."
            rows={3}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              className="gap-2"
              disabled={createComment.isPending || !commentBody.trim()}
            >
              <Send className="size-4" />
              {createComment.isPending ? "Posting..." : "Comment"}
            </Button>
          </div>
        </form>

        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
        ) : (
          <div className="space-y-4 pt-2">
            {comments.map((comment: any) => (
              <div key={comment.comment?.id ?? comment.id} className="flex gap-3">
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback>
                    {(comment.author?.name ?? comment.comment?.authorId ?? "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{comment.author?.name ?? "Unknown"}</span>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(comment.comment?.createdAt ?? comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{comment.comment?.body ?? comment.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
