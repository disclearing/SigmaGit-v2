import { Link } from "@tanstack/react-router";
import { Clock, Star } from "lucide-react";
import { cn, formatDate } from "@sigmagit/lib";
import { useStarRepository, type RepositoryWithStars } from "@sigmagit/hooks";
import { Button, buttonVariants } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { StarButton } from "./star-button";

export default function RepositoryCard({ repository, showOwner = false }: { repository: RepositoryWithStars; showOwner?: boolean }) {


  return (
    <div className="group relative border-b border-border py-4 first:pt-0 last:border-b-0 hover:bg-muted/30 transition-colors">
      <Link to="/$username/$repo" params={{ username: repository.owner.username, repo: repository.name }} className="absolute inset-0" />
      <span className="sr-only">View {repository.name}</span>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-base font-semibold text-primary hover:underline truncate">
                {showOwner ? (
                  <>
                    <Link
                      to="/$username"
                      params={{ username: repository.owner.username }}
                      onClick={(e) => e.stopPropagation()}
                      className="z-10 text-muted-foreground hover:text-primary"
                    >
                      {repository.owner.username}
                    </Link>
                    <span className="text-muted-foreground mx-0.5">/</span>
                    <span className="text-foreground">{repository.name}</span>
                  </>
                ) : (
                  repository.name
                )}
              </h3>
              {repository.visibility === "private" && (
                <span className="px-1.5 py-0.5 text-xs font-medium border border-border rounded-md text-muted-foreground shrink-0">
                  Private
                </span>
              )}
            </div>
            <StarButton repository={repository} className="z-10 shrink-0" />
          </div>
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{repository.description || "No description"}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {(repository as any).language && (
              <span className="flex items-center gap-1">
                <span className="size-3 rounded-full bg-primary" />
                {(repository as any).language}
              </span>
            )}
            <div className="flex items-center gap-1">
              <Star className="size-3" />
              <span>{repository.starCount || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="size-3" />
              <span>Updated {formatDate((repository as any).updatedAt || repository.createdAt, "MMM d, yyyy")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
