"use client";

import { useLabels, usePullRequestCount, usePullRequests } from "@sigmagit/hooks";
import { CheckCircle2, Circle, GitMerge, Loader2, Plus, Tag } from "lucide-react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { parseAsStringLiteral, useQueryState } from "@/lib/hooks";
import { createMeta } from "@/lib/seo";
import { PRItem } from "@/components/pulls/pr-item";

export const Route = createFileRoute("/_main/$username/$repo/pulls/")({
  head: ({ params }) => ({
    meta: createMeta({
      title: `${params.username}/${params.repo} · Pull Requests`,
      description: `Pull requests for ${params.username}/${params.repo} on Sigmagit.`,
    }),
  }),
  component: PullsPage,
});

function PullsContent() {
  const { username, repo } = Route.useParams();
  const [state, setState] = useQueryState(
    "state",
    parseAsStringLiteral(["open", "closed", "merged", "all"]).withDefault("open")
  );
  const [labelFilter, setLabelFilter] = useQueryState("label");

  const [showLabelFilter, setShowLabelFilter] = useState(false);

  const { data: countData, isLoading: isLoadingCount } = usePullRequestCount(username, repo);
  const { data: labelsData } = useLabels(username, repo);
  const { data: pullsData, isLoading: isLoadingPulls } = usePullRequests(username, repo, {
    state,
    label: labelFilter || undefined,
    limit: 30,
  });

  const isLoading = isLoadingCount || isLoadingPulls;
  const pullRequests = pullsData?.pullRequests || [];
  const labels = labelsData?.labels || [];
  const openCount = countData?.open || 0;
  const closedCount = countData?.closed || 0;
  const mergedCount = countData?.merged || 0;

  return (
    <div className="container max-w-6xl px-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Tabs
            value={state}
            onValueChange={(value) => setState(value as "open" | "closed" | "merged" | "all")}
          >
            <TabsList variant="line" className="w-full justify-start h-auto mb-6 gap-2 bg-transparent p-0">
              <TabsTrigger value="open" className="gap-2 text-sm px-3 py-2 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none">
                <Circle className="size-4" />
                <span>{openCount} Open</span>
              </TabsTrigger>
              <TabsTrigger value="merged" className="gap-2 text-sm px-3 py-2 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none">
                <GitMerge className="size-4" />
                <span>{mergedCount} Merged</span>
              </TabsTrigger>
              <TabsTrigger value="closed" className="gap-2 text-sm px-3 py-2 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none">
                <CheckCircle2 className="size-4" />
                <span>{closedCount} Closed</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            {labels.length > 0 && (
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLabelFilter(!showLabelFilter)}
                  className={cn(labelFilter && "border-primary")}
                >
                  <Tag className="size-4 mr-1.5" />
                  {labelFilter || "Label"}
                </Button>
                {showLabelFilter && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowLabelFilter(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border shadow-lg p-1 min-w-[150px]">
                      {labelFilter && (
                        <button
                          onClick={() => {
                            setLabelFilter(null);
                            setShowLabelFilter(false);
                          }}
                          className="w-full px-3 py-1.5 text-sm text-left hover:bg-secondary transition-colors text-muted-foreground"
                        >
                          Clear filter
                        </button>
                      )}
                      {labels.map((label) => (
                        <button
                          key={label.id}
                          onClick={() => {
                            setLabelFilter(label.name);
                            setShowLabelFilter(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-secondary transition-colors",
                            labelFilter === label.name && "bg-secondary"
                          )}
                        >
                          <span
                            className="w-3 h-3 shrink-0"
                            style={{ backgroundColor: `#${label.color}` }}
                          />
                          {label.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <Link to="/$username/$repo/pulls/new" params={{ username, repo }}>
              <Button size="sm">
                <Plus className="size-4 mr-1.5" />
                New pull request
              </Button>
            </Link>
          </div>
        </div>

        {isLoading && !pullRequests.length ? (
          <PRListSkeleton />
        ) : (
          <div className="border border-border rounded-lg bg-card overflow-hidden divide-y divide-border">
            {pullRequests.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <GitMerge className="size-12 mx-auto mb-4 opacity-50" />
                <p className="text-base font-medium">No pull requests found</p>
                <p className="text-sm mt-1">Get started by creating a new pull request</p>
              </div>
            ) : (
              pullRequests.map((pr) => (
                <PRItem key={pr.id} pullRequest={pr} username={username} repo={repo} />
              ))
            )}
          </div>
        )}
      </div>

    </div>
  );
}

function PullsPage() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-[1280px] mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground"
            />
          </div>
        </div>
      }
    >
      <PullsContent />
    </Suspense>
  );
}

function PRListSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="border border-border bg-card overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0"
          >
            <div className="h-6 w-16 bg-secondary/50" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-3/4 bg-secondary/50" />
              <div className="h-3 w-1/2 bg-secondary/50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
