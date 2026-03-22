import { CheckCircle2, Circle, GitMerge } from "lucide-react";
import { cn } from "@/lib/utils";

interface StateBadgeProps {
  state: "open" | "closed" | "merged";
  className?: string;
}

const stateConfig = {
  open: {
    icon: Circle,
    label: "Open",
    className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  },
  closed: {
    icon: CheckCircle2,
    label: "Closed",
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
  merged: {
    icon: GitMerge,
    label: "Merged",
    className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
};

export function StateBadge({ state, className }: StateBadgeProps) {
  const config = stateConfig[state];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border",
        config.className,
        className
      )}
    >
      <Icon className="size-3.5" />
      {config.label}
    </span>
  );
}
