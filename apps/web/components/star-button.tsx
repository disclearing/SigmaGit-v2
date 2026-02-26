"use client";

import { Star } from "lucide-react";
import { type RepositoryWithStars, useStarRepository } from "@sigmagit/hooks";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function StarButton({
  repository,
  className,
}: {
  repository: RepositoryWithStars;
  className?: string;
}) {
  const { isStarred, isLoading, starCount, toggleStar, isMutating } = useStarRepository(repository.id, repository.starCount);

  if (isLoading) {
    return (
      <div className={cn(
        "inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-muted animate-pulse",
        className
      )}>
        <div className="size-4 bg-muted-foreground/20 rounded" />
        <div className="w-12 h-4 bg-muted-foreground/20 rounded" />
      </div>
    );
  }

  return (
    <Button
      variant={isStarred ? "secondary" : "outline"}
      size="sm"
      onClick={() => toggleStar()}
      disabled={isMutating}
      className={cn(
        "gap-2 rounded-lg transition-all duration-200",
        isStarred && "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 hover:border-primary/30",
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
      <span>{isStarred ? "Starred" : "Star"}</span>
      {starCount > 0 && (
        <span className="font-mono text-xs px-1.5 py-0.5 rounded-md bg-foreground/5">
          {starCount}
        </span>
      )}
    </Button>
  );
}
