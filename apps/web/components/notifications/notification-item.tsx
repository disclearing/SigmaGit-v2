import { Link } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, GitBranch, GitPullRequest, MessageSquare, User } from "lucide-react";
import { formatRelativeTime } from "@sigmagit/lib";
import type { Notification } from "@sigmagit/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const typeConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  issue_comment: { icon: MessageSquare, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  issue_assigned: { icon: AlertCircle, color: "text-orange-500", bgColor: "bg-orange-500/10" },
  issue_closed: { icon: CheckCircle2, color: "text-red-500", bgColor: "bg-red-500/10" },
  pr_comment: { icon: MessageSquare, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  pr_review: { icon: GitPullRequest, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  pr_merged: { icon: GitPullRequest, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  pr_assigned: { icon: GitPullRequest, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  mention: { icon: User, color: "text-green-500", bgColor: "bg-green-500/10" },
  discussion_reply: { icon: MessageSquare, color: "text-blue-500", bgColor: "bg-blue-500/10" },
};

function getNotificationUrl(notification: Notification): string {
  if (!notification.repoOwner || !notification.repoName || !notification.resourceNumber) {
    return "/";
  }

  const basePath = `/${notification.repoOwner}/${notification.repoName}`;

  switch (notification.resourceType) {
    case "issue":
      return `${basePath}/issues/${notification.resourceNumber}`;
    case "pull_request":
      return `${basePath}/pulls/${notification.resourceNumber}`;
    case "discussion":
      return `${basePath}/discussions/${notification.resourceNumber}`;
    default:
      return basePath;
  }
}

export function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead?: () => void;
}) {
  const config = typeConfig[notification.type] || typeConfig.issue_comment;
  const Icon = config.icon;
  const url = getNotificationUrl(notification);

  function handleClick() {
    if (!notification.read && onMarkRead) {
      onMarkRead();
    }
  }

  return (
    <Link
      to={url}
      onClick={handleClick}
      className={cn(
        "flex items-start gap-3 p-4 transition-all duration-200",
        "hover:bg-accent/50",
        !notification.read && "bg-primary/5 hover:bg-primary/10"
      )}
    >
      <div className="mt-0.5 shrink-0">
        {notification.actor ? (
          <Avatar className="size-9" size="sm">
            <AvatarImage src={notification.actor.avatarUrl || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-muted to-muted/50 text-xs font-semibold">
              {notification.actor.name?.charAt(0) || notification.actor.username?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className={cn("size-9 rounded-lg flex items-center justify-center", config.bgColor)}>
            <Icon className={cn("size-4", config.color)} />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm leading-snug", !notification.read && "font-medium")}>
            {notification.title}
          </p>
          {!notification.read && (
            <div className="size-2.5 bg-primary rounded-full shrink-0 mt-1.5 shadow-sm" />
          )}
        </div>

        {notification.body && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
            {notification.body}
          </p>
        )}

        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          {notification.repoOwner && notification.repoName && (
            <span className="flex items-center gap-1">
              <GitBranch className="size-3" />
              {notification.repoOwner}/{notification.repoName}
            </span>
          )}
          <span>•</span>
          <span>{formatRelativeTime(notification.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
