"use client";

import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  useCreateGistComment,
  useDeleteGist,
  useForkGist,
  useGist,
  useGistComments,
  useIsGistStarred,
  useToggleGistStar,
} from "@sigmagit/hooks";
import { ArrowLeft, Check, Clock, Copy, Edit, FileCode2, GitFork, MessageSquare, MoreHorizontal, Send, ShieldAlert, Star, Trash2 } from "lucide-react";
import { getLanguage, timeAgo } from "@sigmagit/lib";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CodeViewer } from "@/components/code-viewer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportDialog } from "@/components/report-dialog";
import { DmcaDialog } from "@/components/dmca-dialog";
import { createMeta } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";

export const Route = createFileRoute("/_main/gists/$id")({
  head: () => ({ meta: createMeta({ title: "Gist", description: "View and share this code snippet on Sigmagit." }) }),
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
  const [copied, setCopied] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isDmcaDialogOpen, setIsDmcaDialogOpen] = useState(false);

  const comments = commentsData?.comments ?? [];
  const isStarred = starredData?.starred ?? false;
  const isOwner = !!(session?.user?.id && gist && session.user.id === ((gist as any).ownerId ?? (gist as any).owner?.id));

  if (isLoading) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!gist) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-8">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="size-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <FileCode2 className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Gist not found</h3>
            <p className="text-muted-foreground mb-6">The gist you're looking for doesn't exist or has been removed.</p>
            <Link to="/gists">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="size-4" />
                Back to gists
              </Button>
            </Link>
          </CardContent>
        </Card>
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

  function handleCopyUrl() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("URL copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
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

  const owner = (gist as any).owner;

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      {/* Back Link */}
      <Link to="/gists" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="size-4" />
        Back to gists
      </Link>

      {/* Header Card */}
      <Card className="mb-6 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold mb-3">
                {(gist as any).description || files[0]?.filename || "Untitled gist"}
              </h1>
              <div className="flex items-center gap-4 flex-wrap">
                {owner && (
                  <Link
                    to="/$username"
                    params={{ username: owner.username }}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <Avatar className="size-6">
                      <AvatarImage src={owner.avatarUrl} />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-muted to-muted/50">
                        {owner.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{owner.name || owner.username}</span>
                  </Link>
                )}
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3" />
                  Created {timeAgo((gist as any).createdAt)}
                </span>
                <Badge variant="outline" className="text-xs">
                  {(gist as any).visibility === "public" ? "Public" : "Secret"}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant={isStarred ? "secondary" : "outline"}
                size="sm"
                onClick={() => toggleStar.mutate(id)}
                className={cn("gap-2", isStarred && "bg-yellow-500/10 border-yellow-500/20 text-yellow-600")}
                disabled={toggleStar.isPending}
              >
                <Star className={cn("size-4", isStarred && "fill-yellow-400 text-yellow-400")} />
                {isStarred ? "Starred" : "Star"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleFork} className="gap-2" disabled={forkGist.isPending}>
                <GitFork className="size-4" />
                Fork
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
                className="gap-2"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="size-8 p-0">
                    <MoreHorizontal className="size-4" />
                    <span className="sr-only">More</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsReportDialogOpen(true)}>Report gist</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsDmcaDialogOpen(true)}>
                    <ShieldAlert className="mr-2 size-4" />
                    File DMCA takedown
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <ReportDialog
        targetType="gist"
        targetId={id}
        targetName={(gist as any).description || files[0]?.filename || "Untitled gist"}
        open={isReportDialogOpen}
        onOpenChange={setIsReportDialogOpen}
      />
      <DmcaDialog
        targetType="gist"
        targetId={id}
        targetName={(gist as any).description || files[0]?.filename || "Untitled gist"}
        open={isDmcaDialogOpen}
        onOpenChange={setIsDmcaDialogOpen}
      />

      {/* Files */}
      <div className="space-y-4 mb-8">
        {files.length > 0 ? (
          files.map((file: any) => {
            const language = file.language || getLanguage(file.filename);
            return (
              <Card key={file.id} className="overflow-hidden">
                <CardHeader className="py-3 px-4 bg-muted/50 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileCode2 className="size-4 text-muted-foreground" />
                      <span className="font-mono text-sm font-medium">{file.filename}</span>
                    </div>
                    {language && language !== "plaintext" && (
                      <Badge variant="secondary" className="text-xs capitalize">
                        {language}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <CodeViewer content={file.content} language={language} showLineNumbers wordWrap={false} />
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No files in this gist</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="size-5" />
            Comments
            <Badge variant="secondary" className="text-xs">{comments.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Comment Form */}
          {session?.user && (
            <form onSubmit={handleCommentSubmit} className="space-y-3">
              <Textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Leave a comment..."
                rows={3}
                className="resize-none"
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
          )}

          <Separator />

          {/* Comments List */}
          {comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment: any) => (
                <div key={comment.comment?.id ?? comment.id} className="flex gap-3">
                  <Avatar className="size-8 shrink-0">
                    <AvatarImage src={comment.author?.avatarUrl} />
                    <AvatarFallback className="text-xs bg-gradient-to-br from-muted to-muted/50">
                      {(comment.author?.name ?? comment.comment?.authorId ?? "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{comment.author?.name ?? "Unknown"}</span>
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(comment.comment?.createdAt ?? comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                      {comment.comment?.body ?? comment.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
