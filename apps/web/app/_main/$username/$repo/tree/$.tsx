import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useRepoTree, useRepositoryWithStars, useTreeCommits } from "@sigmagit/hooks";
import { ChevronRight, Home } from "lucide-react";
import { createMeta } from "@/lib/seo";
import { FileTree } from "@/components/file-tree";

export const Route = createFileRoute("/_main/$username/$repo/tree/$")({
  head: ({ params }) => ({
    meta: createMeta({
      title: `${params.username}/${params.repo} · Files`,
      description: `Browse files and directories in ${params.username}/${params.repo} on Sigmagit.`,
    }),
  }),
  component: TreePage,
});

function TreeSkeleton() {
  return (
    <div className="divide-y divide-border">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-2.5 animate-pulse">
          <div className="h-4 w-4 bg-muted" />
          <div className="h-4 bg-muted w-1/4" />
          <div className="h-4 bg-muted w-1/3 ml-auto hidden sm:block" />
          <div className="h-4 bg-muted w-20" />
        </div>
      ))}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="container px-4 py-6">
      <div className="border border-border overflow-hidden">
        <div className="h-12 bg-card border-b border-border" />
        <TreeSkeleton />
      </div>
    </div>
  );
}

function TreePage() {
  const { username, repo: repoName, _splat } = Route.useParams();
  const pathSegments = _splat ? _splat.split("/") : [];

  const branch = pathSegments[0] || "main";
  const dirPath = pathSegments.slice(1).join("/");

  const { data: repo, isLoading: repoLoading, error: repoError } = useRepositoryWithStars(username, repoName);
  const { data: treeData, isLoading: treeLoading, error: treeError } = useRepoTree(username, repoName, branch, dirPath);
  const { data: treeCommitsData, isLoading: isLoadingTreeCommits } = useTreeCommits(username, repoName, branch, dirPath);

  if (repoLoading) {
    return <PageSkeleton />;
  }

  if (repoError || !repo) {
    throw notFound();
  }

  const pathParts = dirPath.split("/").filter(Boolean);
  const treeCommits = treeCommitsData?.files;

  return (
    <div className="container max-w-6xl px-4">
      <div className="border border-border overflow-hidden">
        <nav className="flex items-center gap-1 overflow-x-auto px-4 py-2 bg-muted/30 border-b border-border text-sm whitespace-nowrap">
          <Link to="/$username/$repo" params={{ username, repo: repoName }} className="text-primary hover:underline flex items-center gap-1">
            <Home className="size-4" />
            {repoName}
          </Link>
          {pathParts.map((part, i) => (
            <span key={i} className="flex items-center gap-1 shrink-0">
              <ChevronRight className="size-4 text-muted-foreground" />
              {i === pathParts.length - 1 ? (
                <span className="font-medium">{part}</span>
              ) : (
                <Link
                  to="/$username/$repo/tree/$"
                  params={{
                    username,
                    repo: repoName,
                    _splat: `${branch}/${pathParts.slice(0, i + 1).join("/")}`,
                  }}
                  className="text-primary hover:underline"
                >
                  {part}
                </Link>
              )}
            </span>
          ))}
        </nav>

        {treeLoading ? (
          <TreeSkeleton />
        ) : treeError || !treeData ? (
          <div className="p-8 text-center text-muted-foreground">Failed to load directory</div>
        ) : (
          <div className="bg-card overflow-hidden">
            <FileTree 
              files={treeData.files} 
              username={username} 
              repoName={repoName} 
              branch={branch} 
              basePath={dirPath}
              commits={treeCommits}
              isLoadingCommits={isLoadingTreeCommits}
            />
          </div>
        )}
      </div>
    </div>
  );
}
