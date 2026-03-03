import { Suspense, useEffect, useState } from "react";
import { Link, Outlet, createFileRoute, useLocation, useNavigate, useParams } from "@tanstack/react-router";
import { Circle, Code, Flag, GitFork, GitPullRequest, History, LayoutGrid, Loader2, MoreHorizontal, Package, PlayCircle, Settings, ShieldAlert } from "lucide-react";
import { useForkRepository, useIssueCount, usePullRequestCount, useRepoBranches, useRepoCommitCount, useRepositoryInfo } from "@sigmagit/hooks";
import { toast } from "sonner";
import { BranchSelector } from "@/components/branch-selector";
import { CloneUrl } from "@/components/clone-url";
import { StarButton } from "@/components/star-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReportDialog } from "@/components/report-dialog";
import { DmcaDialog } from "@/components/dmca-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabTriggerClassName =
  "gap-1.5 text-sm px-3 py-2 rounded-none whitespace-nowrap text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-foreground";


function getBranchFromPath(pathname: string, defaultBranch: string): string {
  const treeMatch = pathname.match(/\/tree\/([^/]+)/);
  if (treeMatch) return treeMatch[1];

  const blobMatch = pathname.match(/\/blob\/([^/]+)/);
  if (blobMatch) return blobMatch[1];

  const commitsMatch = pathname.match(/\/commits\/([^/]+)/);
  if (commitsMatch) return commitsMatch[1];

  return defaultBranch;
}

export const Route = createFileRoute("/_main/$username/$repo")({
  component: RepoLayout,
});

function RepoLayout() {
  return (
    <Suspense fallback={<RepoLayoutSkeleton />}>
      <RepoLayoutContent />
    </Suspense>
  );
}

function RepoLayoutContent() {
  const { username, repo: repoName } = useParams({ from: "/_main/$username/$repo" });
  const location = useLocation();
  const navigate = useNavigate();

  const { data: repoInfo, isLoading: isLoadingInfo } = useRepositoryInfo(username, repoName);
  const { data: branchesData, isLoading: isLoadingBranches } = useRepoBranches(username, repoName);
  const { data: issueCountData } = useIssueCount(username, repoName);
  const { data: prCountData } = usePullRequestCount(username, repoName);
  const forkMutation = useForkRepository(username, repoName);

  const repo = repoInfo?.repo;
  const isOwner = repoInfo?.isOwner ?? false;
  const defaultBranch = repo?.defaultBranch || "main";
  const currentBranch = getBranchFromPath(location.pathname, defaultBranch);
  const branches = branchesData?.branches || [];
  const openIssueCount = issueCountData?.open || 0;
  const openPRCount = prCountData?.open || 0;

  const { data: commitCountData } = useRepoCommitCount(username, repoName, currentBranch);
  const commitCount = commitCountData?.count || 0;

  const pathname = location.pathname;
  const isIssues = pathname.includes("/issues") || pathname.includes("/labels");
  const isPulls = pathname.includes("/pulls");
  const isCommits = pathname.includes("/commits");
  const isReleases = pathname.includes("/releases");
  const isSettings = pathname.includes("/settings");
  const isActions = pathname.includes("/workflows") || pathname.includes("/runs");

  const currentTab = isSettings
    ? "settings"
    : isReleases
      ? "releases"
      : isCommits
        ? "commits"
        : isPulls
          ? "pulls"
          : isIssues
            ? "issues"
            : isActions
              ? "actions"
              : "code";
  const forkCount = repo?.forkCount ?? 0;
  const [isForkDialogOpen, setIsForkDialogOpen] = useState(false);
  const [forkName, setForkName] = useState("");
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isDmcaDialogOpen, setIsDmcaDialogOpen] = useState(false);

  useEffect(() => {
    if (repo?.name) {
      setForkName(repo.name);
    }
  }, [repo?.name]);

  function handleForkSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = forkName.trim().toLowerCase().replace(/ /g, "-");
    if (!trimmed) {
      toast.error("Repository name is required");
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
      toast.error("Invalid repository name");
      return;
    }
    forkMutation.mutate({ name: trimmed }, {
      onSuccess: (result) => {
        const forkRepo = result.repo;
        toast.success("Repository forked");
        setIsForkDialogOpen(false);
        navigate({
          to: "/$username/$repo",
          params: {
            username: forkRepo.owner.username,
            repo: forkRepo.name,
          },
        });
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to fork repository");
      },
    });
  }

  return (
    <div className="bg-background">
      <div className="container mx-auto max-w-[1280px] space-y-5 py-6">
        {isLoadingInfo || !repo ? (
          <RepoHeaderSkeleton />
        ) : (
          <div className="space-y-2">
            <RepoHeader
              repo={repo}
              username={username}
              forkCount={forkCount}
              onFork={() => setIsForkDialogOpen(true)}
              isForking={forkMutation.isPending}
              onReport={() => setIsReportDialogOpen(true)}
              onDmca={() => setIsDmcaDialogOpen(true)}
            />
            {repo.description && (
              <p className="max-w-3xl text-sm text-muted-foreground md:text-base">{repo.description}</p>
            )}
            {repo.forkedFrom && (
              <p className="text-xs text-muted-foreground">
                Forked from{" "}
                <Link
                  to="/$username/$repo"
                  params={{ username: repo.forkedFrom.owner.username, repo: repo.forkedFrom.name }}
                  className="text-primary hover:underline"
                >
                  {repo.forkedFrom.owner.username}/{repo.forkedFrom.name}
                </Link>
              </p>
            )}
          </div>
        )}

        <div className="space-y-3 border-b border-border pb-3">
          <div className="overflow-x-auto relative">
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
            <Tabs value={currentTab}>
              <TabsList variant="line" className="h-auto min-w-max gap-1 bg-transparent p-0">
              <Link to="/$username/$repo" params={{ username, repo: repoName }}>
                <TabsTrigger value="code" className={tabTriggerClassName}>
                  <Code className="size-4" />
                  <span>Code</span>
                </TabsTrigger>
              </Link>
              <Link to="/$username/$repo/issues" params={{ username, repo: repoName }}>
                <TabsTrigger value="issues" className={tabTriggerClassName}>
                  <Circle className="size-4" />
                  <span>Issues</span>
                  {openIssueCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-muted rounded-full">
                      {openIssueCount}
                    </span>
                  )}
                </TabsTrigger>
              </Link>
              <Link to="/$username/$repo/pulls" params={{ username, repo: repoName }}>
                <TabsTrigger value="pulls" className={tabTriggerClassName}>
                  <GitPullRequest className="size-4" />
                  <span>Pull requests</span>
                  {openPRCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-muted rounded-full">
                      {openPRCount}
                    </span>
                  )}
                </TabsTrigger>
              </Link>
              <Link
                to="/$username/$repo/commits/$branch"
                params={{ username, repo: repoName, branch: currentBranch }}
              >
                <TabsTrigger value="commits" className={tabTriggerClassName}>
                  <History className="size-4" />
                  <span>Commits</span>
                  {commitCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-muted rounded-full">
                      {commitCount}
                    </span>
                  )}
                </TabsTrigger>
              </Link>
              <Link
                to="/$username/$repo/projects"
                params={{ username, repo: repoName }}
              >
                <TabsTrigger value="projects" className={tabTriggerClassName}>
                  <LayoutGrid className="size-4" />
                  <span>Projects</span>
                </TabsTrigger>
              </Link>
              <Link to="/$username/$repo/releases" params={{ username, repo: repoName }}>
                <TabsTrigger value="releases" className={tabTriggerClassName}>
                  <Package className="size-4" />
                  <span>Releases</span>
                </TabsTrigger>
              </Link>
              <Link to="/$username/$repo/workflows" params={{ username, repo: repoName }}>
                <TabsTrigger value="actions" className={tabTriggerClassName}>
                  <PlayCircle className="size-4" />
                  <span>Actions</span>
                </TabsTrigger>
              </Link>
              {isOwner && (
                <Link to="/$username/$repo/settings" params={{ username, repo: repoName }}>
                  <TabsTrigger value="settings" className={tabTriggerClassName}>
                    <Settings className="size-4" />
                    <span>Settings</span>
                  </TabsTrigger>
                </Link>
              )}
              </TabsList>
            </Tabs>
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
            {isLoadingBranches || isLoadingInfo ? (
              <div className="h-9 w-full animate-pulse bg-secondary/50 sm:w-24" />
            ) : (
              <BranchSelector
                branches={branches}
                currentBranch={currentBranch}
                defaultBranch={defaultBranch}
                username={username}
                repoName={repo?.name || repoName}
                isOwner={isOwner}
              />
            )}
            <CloneUrl username={username} repoName={repo?.name || repoName} className="w-full sm:max-w-[430px]" />
          </div>
        </div>
      </div>

      <Outlet />

      <Dialog open={isForkDialogOpen} onOpenChange={setIsForkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fork repository</DialogTitle>
            <DialogDescription>Choose a name for your fork.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleForkSubmit}>
            <div className="space-y-2">
              <Label htmlFor="fork-name">Repository name</Label>
              <Input
                id="fork-name"
                value={forkName}
                onChange={(e) => setForkName(e.target.value)}
                placeholder="my-fork"
                pattern="^[a-zA-Z0-9_.-]+$"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsForkDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={forkMutation.isPending || !forkName.trim()}>
                {forkMutation.isPending ? "Forking..." : "Fork"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {repo && (
        <>
          <ReportDialog
            targetType="repository"
            targetId={repo.id}
            targetName={`${username}/${repo.name}`}
            open={isReportDialogOpen}
            onOpenChange={setIsReportDialogOpen}
          />
          <DmcaDialog
            targetType="repository"
            targetId={repo.id}
            targetName={`${username}/${repo.name}`}
            open={isDmcaDialogOpen}
            onOpenChange={setIsDmcaDialogOpen}
          />
        </>
      )}
    </div>
  );
}

function RepoHeader({
  repo,
  username,
  forkCount,
  onFork,
  isForking,
  onReport,
  onDmca,
}: {
  repo: any;
  username: string;
  forkCount: number;
  onFork: () => void;
  isForking: boolean;
  onReport: () => void;
  onDmca: () => void;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight truncate">{repo.name}</h1>
        <span className="px-2 py-0.5 text-xs font-medium uppercase tracking-wider border border-border rounded-md text-muted-foreground shrink-0">
          {repo.visibility}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <StarButton repository={repo} />
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 rounded-md border-border bg-background px-3 text-muted-foreground"
          onClick={onFork}
          disabled={isForking}
        >
          <GitFork className="size-3.5" />
          <span className="text-sm">{isForking ? "Forking..." : "Fork"}</span>
          {forkCount > 0 && (
            <span className="rounded border border-border/70 bg-muted/60 px-1.5 py-0.5 font-mono text-[11px] leading-none text-foreground/80">
              {forkCount}
            </span>
          )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 rounded-md border-border px-3 text-muted-foreground"
            >
              <Flag className="size-3.5" />
              <span className="text-sm">Report</span>
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onReport}>Report repository</DropdownMenuItem>
            <DropdownMenuItem onClick={onDmca}>
              <ShieldAlert className="mr-2 size-4" />
              File DMCA takedown
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function RepoHeaderSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-6 w-32 bg-secondary/50 " />
          <div className="h-5 w-14 bg-secondary/50 " />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-20 bg-secondary/50 " />
          <div className="h-8 w-16 bg-secondary/50 " />
        </div>
      </div>
      <div className="h-4 w-48 bg-secondary/50 " />
    </div>
  );
}

function RepoLayoutSkeleton() {
  return (
    <div className="container max-w-[1280px] py-6 space-y-4">
      <RepoHeaderSkeleton />
      <div className="space-y-3 border-b border-border/40 pb-3 animate-pulse">
        <div className="flex items-center gap-1 overflow-x-auto">
          <div className="h-8 w-16 bg-secondary/50 " />
          <div className="h-8 w-16 bg-secondary/50 " />
          <div className="h-8 w-20 bg-secondary/50 " />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <div className="h-8 w-24 bg-secondary/50 " />
          <div className="h-8 w-full bg-secondary/50 sm:w-72" />
        </div>
      </div>
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}
