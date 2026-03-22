import { Link } from "@tanstack/react-router";
import { AlertCircle, BookOpen, GitBranch, GitPullRequest, Hash, User } from "lucide-react";
import { formatRelativeTime } from "@sigmagit/lib";
import type { SearchResult } from "@sigmagit/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const typeConfig = {
  repository: { icon: GitBranch, label: "Repository", color: "text-blue-500", bgColor: "bg-blue-500/10" },
  issue: { icon: AlertCircle, label: "Issue", color: "text-green-500", bgColor: "bg-green-500/10" },
  pull_request: { icon: GitPullRequest, label: "Pull Request", color: "text-purple-500", bgColor: "bg-purple-500/10" },
  user: { icon: User, label: "User", color: "text-orange-500", bgColor: "bg-orange-500/10" },
  code: { icon: Hash, label: "Code", color: "text-gray-500", bgColor: "bg-gray-500/10" },
};

const stateConfig = {
  open: { variant: "success", label: "Open" },
  closed: { variant: "destructive", label: "Closed" },
  merged: { variant: "default", label: "Merged" },
};

export function SearchResultItem({ result }: { result: SearchResult }) {
  const config = typeConfig[result.type];
  const Icon = config.icon;

  return (
    <Link
      to={result.url}
      className={cn(
        "flex items-start gap-4 p-4 transition-all duration-200",
        "hover:bg-accent/50",
        "border-b border-border/50 last:border-b-0"
      )}
    >
      <div className="mt-0.5 shrink-0">
        {result.type === "user" && result.owner ? (
          <Avatar className="size-10" size="default">
            <AvatarImage src={result.owner.avatarUrl || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-muted to-muted/50 font-semibold">
              {result.title.charAt(0)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className={cn("size-10 rounded-xl flex items-center justify-center", config.bgColor)}>
            <Icon className={cn("size-5", config.color)} />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm hover:text-primary transition-colors">
            {result.title}
          </span>
          {result.number && (
            <span className="text-muted-foreground text-sm">#{result.number}</span>
          )}
          {result.state && (
            <Badge
              variant={stateConfig[result.state]?.variant || "outline"}
              className="text-[10px] px-2 py-0.5"
            >
              {stateConfig[result.state]?.label || result.state}
            </Badge>
          )}
        </div>

        {result.repository && (
          <div className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
            <GitBranch className="size-3" />
            {result.repository.owner}/{result.repository.name}
          </div>
        )}

        {result.description && (
          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
            {result.description}
          </p>
        )}

        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Icon className="size-3" />
            {config.label}
          </span>
          <span>•</span>
          <span>{formatRelativeTime(result.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}

export function SearchResultsList({ results }: { results: Array<SearchResult> }) {
  if (results.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <BookOpen className="size-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium">No results found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your search terms
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden bg-card">
      {results.map((result) => (
        <SearchResultItem key={`${result.type}-${result.id}`} result={result} />
      ))}
    </div>
  );
}
