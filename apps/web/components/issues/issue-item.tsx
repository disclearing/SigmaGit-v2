import { Link } from "@tanstack/react-router";
import { timeAgo } from "@sigmagit/lib";
import { MessageSquare, GitBranch } from "lucide-react";
import type { Issue } from "@sigmagit/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StateBadge } from "./state-badge";
import { LabelBadge } from "./label-badge";
import { cn } from "@/lib/utils";

interface IssueItemProps {
  issue: Issue;
  username: string;
  repo: string;
}

export function IssueItem({ issue, username, repo }: IssueItemProps) {
  return (
    <div className={cn(
      "flex items-start gap-4 p-4 transition-all duration-200",
      "hover:bg-accent/50",
      "border-b border-border/50 last:border-b-0"
    )}>
      <StateBadge state={issue.state} className="mt-0.5 shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <Link
            to="/$username/$repo/issues/$number"
            params={{ username, repo, number: String(issue.number) }}
            className="font-semibold text-sm text-foreground hover:text-primary transition-colors leading-snug"
          >
            {issue.title}
          </Link>
          {issue.labels.map((label) => (
            <LabelBadge key={label.id} label={label} />
          ))}
        </div>

        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/70">#{issue.number}</span>
          <span>opened {timeAgo(issue.createdAt)}</span>
          <span>by</span>
          <Link
            to="/$username"
            params={{ username: issue.author.username }}
            className="font-medium hover:text-foreground transition-colors"
          >
            {issue.author.username}
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {issue.assignees.length > 0 && (
          <div className="flex -space-x-2">
            {issue.assignees.slice(0, 3).map((assignee) => (
              <Avatar key={assignee.id} className="size-6 border-2 border-background" size="xs">
                <AvatarImage src={assignee.avatarUrl || undefined} />
                <AvatarFallback className="text-[8px] bg-gradient-to-br from-muted to-muted/50">
                  {assignee.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ))}
            {issue.assignees.length > 3 && (
              <span className="flex items-center justify-center size-6 bg-muted text-[8px] font-medium border-2 border-background rounded-full">
                +{issue.assignees.length - 3}
              </span>
            )}
          </div>
        )}

        {issue.commentCount > 0 && (
          <Link
            to="/$username/$repo/issues/$number"
            params={{ username, repo, number: String(issue.number) }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageSquare className="size-3.5" />
            <span className="font-medium">{issue.commentCount}</span>
          </Link>
        )}
      </div>
    </div>
  );
}
