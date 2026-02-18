import { Link } from "@tanstack/react-router";
import { BookOpen, AlertCircle, GitPullRequest, User } from "lucide-react";
import { formatRelativeTime } from "@sigmagit/lib";
import type { SearchResult } from "@sigmagit/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const typeIcons = {
  repository: BookOpen,
  issue: AlertCircle,
  pull_request: GitPullRequest,
  user: User,
};

const typeLabels = {
  repository: "Repository",
  issue: "Issue",
  pull_request: "Pull Request",
  user: "User",
};

export function SearchResultItem({ result }: { result: SearchResult }) {
  const Icon = typeIcons[result.type];

  return (
    <Link
      to={result.url}
      className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
    >
      <div className="mt-1">
        {result.type === "user" && result.owner ? (
          <Avatar className="size-8">
            <AvatarImage src={result.owner.avatarUrl || undefined} />
            <AvatarFallback>{result.title.charAt(0)}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="size-8 bg-muted flex items-center justify-center">
            <Icon className="size-4 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium hover:underline">{result.title}</span>
          {result.number && (
            <span className="text-muted-foreground">#{result.number}</span>
          )}
          {result.state && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                result.state === "open" && "border-green-500 text-green-600",
                result.state === "closed" && "border-red-500 text-red-600",
                result.state === "merged" && "border-purple-500 text-purple-600"
              )}
            >
              {result.state}
            </Badge>
          )}
        </div>

        {result.repository && (
          <div className="text-sm text-muted-foreground mt-0.5">
            {result.repository.owner}/{result.repository.name}
          </div>
        )}

        {result.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {result.description}
          </p>
        )}

        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span>{typeLabels[result.type]}</span>
          <span>{formatRelativeTime(result.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}

export function SearchResultsList({ results }: { results: SearchResult[] }) {
  if (results.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No results found
      </div>
    );
  }

  return (
    <div className="border border-border overflow-hidden">
      {results.map((result) => (
        <SearchResultItem key={`${result.type}-${result.id}`} result={result} />
      ))}
    </div>
  );
}
