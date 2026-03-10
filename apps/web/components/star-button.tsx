"use client";

import { Star } from "lucide-react";
import { useStarRepository } from "@sigmagit/hooks";
import type { RepositoryWithStars } from "@sigmagit/hooks";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function getInitialStarred(repository: RepositoryWithStars & { starred?: boolean }): boolean | undefined {
  if (repository.starredByViewer !== undefined) return repository.starredByViewer;
  if (repository.starred !== undefined) return repository.starred;
  return undefined;
}

export function StarButton({
  repository,
  className,
}: {
  repository: RepositoryWithStars;
  className?: string;
}) {
  const initialStarred = getInitialStarred(repository);
  const { isStarred, isLoading, starCount, toggleStar, isMutating } = useStarRepository(repository.id, repository.starCount, initialStarred);

  if (isLoading) {
    return (
      <div className={cn(
        "inline-flex h-8 items-center gap-2 rounded-md border border-border bg-muted/40 px-3 animate-pulse",
        className
      )}>
        <div className="size-4 bg-muted-foreground/20 rounded" />
        <div className="w-12 h-4 bg-muted-foreground/20 rounded" />
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => toggleStar()}
      disabled={isMutating}
      className={cn(
        "h-8 gap-2 rounded-md border-border bg-background px-3 text-muted-foreground transition-colors",
        isStarred && "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15",
        className
      )}
    >
      <Star
        fill={isStarred ? "currentColor" : "none"}
        className={cn(
          "size-4 transition-all duration-200",
          isStarred ? "text-primary" : "text-muted-foreground"
        )}
      />
      <span className="text-sm">{isStarred ? "Starred" : "Star"}</span>
      {starCount > 0 && (
        <span className="rounded border border-border/70 bg-muted/60 px-1.5 py-0.5 font-mono text-[11px] leading-none text-foreground/80">
          {starCount}
        </span>
      )}
    </Button>
  );
}
