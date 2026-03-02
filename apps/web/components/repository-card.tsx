import { Link } from "@tanstack/react-router";
import { Circle, Clock, GitFork, Globe, Lock, Star } from "lucide-react";
import { cn, timeAgo } from "@sigmagit/lib";
import {  useStarRepository } from "@sigmagit/hooks";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import type {RepositoryWithStars} from "@sigmagit/hooks";

type Repository = RepositoryWithStars & {
  updatedAt: Date | string;
  language?: string;
  forksCount?: number;
};

// Language color mapping
const languageColors: Record<string, string> = {
  TypeScript: "bg-blue-500",
  JavaScript: "bg-yellow-400",
  Python: "bg-blue-400",
  Java: "bg-orange-600",
  Go: "bg-cyan-500",
  Rust: "bg-orange-700",
  "C++": "bg-pink-600",
  C: "bg-gray-500",
  "C#": "bg-green-600",
  Ruby: "bg-red-500",
  PHP: "bg-purple-500",
  Swift: "bg-orange-500",
  Kotlin: "bg-purple-600",
  HTML: "bg-orange-600",
  CSS: "bg-blue-600",
  Shell: "bg-green-500",
  Vue: "bg-green-400",
  React: "bg-cyan-400",
  Svelte: "bg-orange-500",
  Dart: "bg-cyan-400",
  Scala: "bg-red-400",
  R: "bg-blue-300",
  Julia: "bg-purple-400",
  Elixir: "bg-purple-700",
  Haskell: "bg-purple-800",
  Lua: "bg-blue-700",
  Perl: "bg-pink-400",
  default: "bg-primary",
};

export default function RepositoryCard({ repository, showOwner = false }: { repository: Repository; showOwner?: boolean }) {
  const { isStarred, isLoading, starCount, toggleStar, isMutating } = useStarRepository(repository.id, repository.starCount);
  const ownerUsername = repository.owner.username;
  const isPrivate = repository.visibility === "private";

  const languageColor = repository.language ? languageColors[repository.language] || languageColors.default : languageColors.default;

  return (
    <div className="group relative p-5 rounded-xl border border-border/50 bg-card/50 hover:bg-card hover:border-border hover:shadow-lg transition-all duration-300">
      <Link to="/$username/$repo" params={{ username: ownerUsername, repo: repository.name }} className="absolute inset-0 rounded-xl" />
      <span className="sr-only">View {repository.name}</span>

      <div className="flex items-start justify-between gap-4 relative">
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors duration-200">
                {showOwner ? (
                <span className="flex items-center gap-1.5">
                    <Link
                      to="/$username"
                      params={{ username: ownerUsername }}
                      onClick={(e) => e.stopPropagation()}
                    className="z-10 text-muted-foreground hover:text-primary font-normal transition-colors"
                    >
                      {ownerUsername}
                    </Link>
                  <span className="text-muted-foreground/50">/</span>
                  <span className="text-foreground group-hover:text-primary transition-colors">{repository.name}</span>
                </span>
                ) : (
                <span className="flex items-center gap-2">
                  <GitFork className="size-4 text-muted-foreground" />
                  {repository.name}
                </span>
              )}
            </h3>

            {isPrivate ? (
              <Badge variant="secondary" className="shrink-0 text-[10px] px-2 py-0.5">
                <Lock className="size-3 mr-1" />
                Private
              </Badge>
            ) : (
              <Badge variant="outline" className="shrink-0 text-[10px] px-2 py-0.5">
                <Globe className="size-3 mr-1" />
                Public
              </Badge>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
            {repository.description || "No description provided"}
          </p>

          {/* Footer stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {repository.language && (
              <span className="flex items-center gap-1.5">
                <span className={cn("size-3 rounded-full", languageColor)} />
                <span className="font-medium">{repository.language}</span>
              </span>
            )}

            <span className="flex items-center gap-1.5">
              <Star className="size-3.5" />
              <span className="font-medium">{starCount || 0}</span>
            </span>

            {repository.forksCount !== undefined && repository.forksCount > 0 && (
              <span className="flex items-center gap-1.5">
                <GitFork className="size-3.5" />
                <span className="font-medium">{repository.forksCount}</span>
              </span>
            )}

            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5" />
              <span>Updated {timeAgo(repository.updatedAt)}</span>
            </span>
          </div>
        </div>

        {/* Star button */}
        <Button
          variant={isStarred ? "secondary" : "outline"}
          size="sm"
          className={cn(
            "z-10 shrink-0 gap-1.5 rounded-lg transition-all duration-200",
            isStarred && "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
          )}
          disabled={isMutating || isLoading}
          onClick={(e) => {
            e.stopPropagation();
            toggleStar();
          }}
        >
          <Star
            fill={isStarred ? "currentColor" : "none"}
            className={cn("size-4 transition-all duration-200", isStarred ? "text-primary" : "text-muted-foreground")}
          />
          {isStarred ? "Starred" : "Star"}
        </Button>
      </div>
    </div>
  );
}
