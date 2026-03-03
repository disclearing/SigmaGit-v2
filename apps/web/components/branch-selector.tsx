import { useState } from "react";
import { CheckCircle2, ChevronDown, GitBranch, Star, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useDeleteBranch, useSetDefaultBranch } from "@sigmagit/hooks";
import { toast } from "sonner";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type BranchSelectorProps = {
  branches: Array<string>;
  currentBranch: string;
  defaultBranch: string;
  username: string;
  repoName: string;
  isOwner?: boolean;
};

type RouteContext = "root" | "tree" | "blob" | "commits";

function getRouteContext(pathname: string): RouteContext {
  if (pathname.includes("/tree/")) return "tree";
  if (pathname.includes("/blob/")) return "blob";
  if (pathname.includes("/commits/")) return "commits";
  return "root";
}

function getCurrentPath(pathname: string, context: RouteContext): string {
  if (context === "root" || context === "commits") return "";

  const match = pathname.match(/\/(tree|blob)\/[^/]+\/(.+)/);
  if (match) {
    return match[2];
  }
  return "";
}

export function BranchSelector({
  branches,
  currentBranch,
  defaultBranch,
  username,
  repoName,
  isOwner = false,
}: BranchSelectorProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [branchToDelete, setBranchToDelete] = useState<string | null>(null);

  const deleteBranchMutation = useDeleteBranch(username, repoName);
  const setDefaultBranchMutation = useSetDefaultBranch(username, repoName);

  const context = getRouteContext(location.pathname);
  const currentPath = getCurrentPath(location.pathname, context);

  const handleBranchChange = (newBranch: string) => {
    if (newBranch === currentBranch) return;

    switch (context) {
      case "root":
        if (newBranch === defaultBranch) {
          navigate({
            to: "/$username/$repo",
            params: { username, repo: repoName },
          });
        } else {
          navigate({
            to: "/$username/$repo/tree/$",
            params: { username, repo: repoName, _splat: newBranch },
          });
        }
        break;
      case "tree":
        navigate({
          to: "/$username/$repo/tree/$",
          params: {
            username,
            repo: repoName,
            _splat: currentPath ? `${newBranch}/${currentPath}` : newBranch,
          },
        });
        break;
      case "blob":
        navigate({
          to: "/$username/$repo/blob/$",
          params: {
            username,
            repo: repoName,
            _splat: currentPath ? `${newBranch}/${currentPath}` : newBranch,
          },
        });
        break;
      case "commits":
        navigate({
          to: "/$username/$repo/commits/$branch",
          params: { username, repo: repoName, branch: newBranch },
        });
        break;
    }
  };

  const handleSetDefault = (e: React.MouseEvent, branch: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (branch === defaultBranch) return;
    setDefaultBranchMutation.mutate(branch, {
      onSuccess: () => {
        toast.success(`Default branch set to ${branch}`);
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to set default branch");
      },
    });
  };

  const handleDeleteClick = (e: React.MouseEvent, branch: string) => {
    e.stopPropagation();
    e.preventDefault();
    setBranchToDelete(branch);
  };

  const confirmDeleteBranch = () => {
    if (!branchToDelete) return;
    const branch = branchToDelete;
    setBranchToDelete(null);
    deleteBranchMutation.mutate(branch, {
      onSuccess: () => {
        toast.success(`Branch ${branch} deleted`);
        if (currentBranch === branch) {
          navigate({ to: "/$username/$repo", params: { username, repo: repoName } });
        }
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to delete branch");
      },
    });
  };

  const canDeleteBranch = (branch: string) =>
    isOwner && branch !== defaultBranch && branches.length > 1;
  const canSetDefault = (branch: string) => isOwner && branch !== defaultBranch;

  if (branches.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 border border-border text-sm">
        <GitBranch className="size-4 text-primary" />
        <span className="font-mono">{currentBranch}</span>
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className={buttonVariants({ variant: "outline", size: "default" })}>
          <GitBranch className="size-4 text-primary" />
          <span className="font-mono max-w-[120px] truncate">{currentBranch}</span>
          <ChevronDown className="size-3 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[260px]">
          <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
            Switch branch
          </div>
          <div className="max-h-[280px] overflow-y-auto py-1">
            {branches.map((branch: string) => {
              const hasActions = canSetDefault(branch) || canDeleteBranch(branch);
              return hasActions ? (
                <DropdownMenuSub key={branch}>
                  <DropdownMenuSubTrigger
                    className={cn(
                      "cursor-pointer px-3 py-2 text-sm font-mono",
                      branch === currentBranch && "bg-primary/10"
                    )}
                  >
                    <CheckCircle2
                      className={cn(
                        "size-3.5 mr-2",
                        branch === currentBranch ? "opacity-100 text-primary" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{branch}</span>
                    {branch === defaultBranch && (
                      <Star className="size-3 ml-1 shrink-0 text-muted-foreground" title="Default branch" />
                    )}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => handleBranchChange(branch)} className="font-mono">
                      <CheckCircle2 className="size-3.5 mr-2" />
                      Switch to this branch
                    </DropdownMenuItem>
                    {canSetDefault(branch) && (
                      <DropdownMenuItem
                        onClick={(e) => handleSetDefault(e, branch)}
                        disabled={setDefaultBranchMutation.isPending}
                      >
                        <Star className="size-3.5 mr-2" />
                        Set as default branch
                      </DropdownMenuItem>
                    )}
                    {canDeleteBranch(branch) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => handleDeleteClick(e, branch)}
                          disabled={deleteBranchMutation.isPending}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="size-3.5 mr-2" />
                          Delete branch
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ) : (
                <DropdownMenuItem
                  key={branch}
                  onClick={() => handleBranchChange(branch)}
                  className={cn("cursor-pointer px-3 py-2 text-sm font-mono", branch === currentBranch && "bg-primary/10")}
                >
                  <CheckCircle2
                    className={cn("size-3.5 mr-2", branch === currentBranch ? "opacity-100 text-primary" : "opacity-0")}
                  />
                  <span className="truncate">{branch}</span>
                  {branch === defaultBranch && (
                    <Star className="size-3 ml-1 shrink-0 text-muted-foreground" title="Default branch" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={branchToDelete !== null} onOpenChange={(open) => !open && setBranchToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete branch</AlertDialogTitle>
            <AlertDialogDescription>
              Delete branch <span className="font-mono font-medium text-foreground">{branchToDelete}</span>? This cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteBranch}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
