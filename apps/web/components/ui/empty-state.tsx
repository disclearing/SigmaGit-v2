import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("py-20 text-center border border-dashed border-border bg-muted/20 rounded-lg", className)}>
      {icon && <div className="flex justify-center mb-4">{icon}</div>}
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
