import { Link } from "@tanstack/react-router";
import { Lock, Globe, Clock, Star } from "lucide-react";
import { cn, timeAgo } from "@sigmagit/lib";
import { useStarRepository, type RepositoryWithStars } from "@sigmagit/hooks";
import { Button } from "./ui/button";

type Repository = RepositoryWithStars & {
  updatedAt: Date | string;
  language?: string;
};

export default function RepositoryCard({ repository, showOwner = false }: { repository: Repository; showOwner?: boolean }) {
  const { isStarred, isLoading, starCount, toggleStar, isMutating } = useStarRepository(repository.id, repository.starCount);
  const ownerUsername = repository.owner.username;
  const isPrivate = repository.visibility === "private";

  return (
    <div className="group relative border-b border-border py-4 first:pt-0 last:border-b-0 hover:bg-muted/30 transition-colors">
      <Link to="/$username/$repo" params={{ username: ownerUsername, repo: repository.name }} className="absolute inset-0" />
      <span className="sr-only">View {repository.name}</span>
      <div className="flex items-start gap-3 relative">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-base font-semibold text-foreground hover:underline truncate">
                {showOwner ? (
                  <>
                    <Link
                      to="/$username"
                      params={{ username: ownerUsername }}
                      onClick={(e) => e.stopPropagation()}
                      className="z-10 text-muted-foreground hover:text-primary font-normal"
                    >
                      {ownerUsername}
                    </Link>
                    <span className="text-muted-foreground mx-0.5">/</span>
                    <span className="text-foreground">{repository.name}</span>
                  </>
                ) : (
                  repository.name
                )}
              </h3>
              {isPrivate && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium border border-border text-muted-foreground bg-transparent uppercase tracking-tight shrink-0">
                  <Lock className="size-3" />
                  Private
                </span>
              )}
            </div>
            <Button
              variant={isStarred ? "secondary" : "outline"}
              size="sm"
              className="z-10 shrink-0 gap-1.5"
              disabled={isMutating || isLoading}
              onClick={(e) => {
                e.stopPropagation();
                toggleStar();
              }}
            >
              <Star fill={isStarred ? "currentColor" : "none"} className={cn("size-3.5", isStarred ? "text-primary" : "text-muted-foreground")} />
              {isStarred ? "Starred" : "Star"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{repository.description || "No description"}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {repository.language && (
              <span className="flex items-center gap-1">
                <span className="size-3 rounded-full bg-primary" />
                {repository.language}
              </span>
            )}
            <div className="flex items-center gap-1">
              <Star className="size-3" />
              <span>{starCount || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="size-3" />
              <span>Updated {timeAgo(repository.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
