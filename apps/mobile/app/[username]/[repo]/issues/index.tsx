import { useState } from "react";
import { View, Text, ScrollView, RefreshControl, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, Link, router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRepositoryInfo, useIssues, useIssueCount } from "@sigmagit/hooks";
import { timeAgo } from "@sigmagit/lib";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { StateBadge } from "@/components/ui/state-badge";
import { LabelBadge } from "@/components/ui/label-badge";
import { EmptyState } from "@/components/ui/empty-state";

export default function IssuesListScreen() {
  const { username, repo: repoName } = useLocalSearchParams<{ username: string; repo: string }>();
  const [stateFilter, setStateFilter] = useState<"open" | "closed" | "all">("open");

  const { data: repoInfo } = useRepositoryInfo(username || "", repoName || "");
  const { data: countData } = useIssueCount(username || "", repoName || "");
  const { data: issuesData, isLoading, refetch, isRefetching } = useIssues(username || "", repoName || "", {
    state: stateFilter,
    limit: 50,
  });

  const issues = issuesData?.issues ?? [];
  const openCount = countData?.open ?? 0;
  const closedCount = countData?.closed ?? 0;

  const tabItems: TabItem[] = [
    { key: "code", label: "Code" },
    { key: "commits", label: "Commits" },
    { key: "issues", label: "Issues", badge: openCount + (stateFilter === "closed" ? closedCount : 0) },
    { key: "pulls", label: "Pull requests" },
    { key: "releases", label: "Releases" },
  ];

  return (
    <View className="flex-1 bg-black">
      <View className="px-4 pt-2 pb-2 border-b border-gray-800">
        <Tabs
          tabs={tabItems}
          activeKey="issues"
          onSelect={(key) => {
            if (key === "code") router.push(`/${username}/${repoName}`);
            else if (key === "commits") router.push(`/${username}/${repoName}/commits`);
            else if (key === "pulls") router.push(`/${username}/${repoName}/pulls`);
            else if (key === "releases") router.push(`/${username}/${repoName}/releases`);
          }}
        />
        <View className="flex-row gap-2 mt-2">
          {(["open", "closed"] as const).map((s) => (
            <Pressable
              key={s}
              onPress={() => setStateFilter(s)}
              className={`px-3 py-1.5 rounded-lg ${stateFilter === s ? "bg-white/10" : ""}`}
            >
              <Text className="text-sm font-medium text-white capitalize">{s}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#60a5fa" />}
      >
        {isLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#60a5fa" />
          </View>
        ) : issues.length === 0 ? (
          <EmptyState
            icon={<FontAwesome name="exclamation-circle" size={40} color="rgba(255,255,255,0.3)" />}
            title={stateFilter === "open" ? "No open issues" : "No closed issues"}
            description={stateFilter === "open" ? "Open an issue to get started." : "No closed issues yet."}
            action={
              stateFilter === "open" ? (
                <Pressable onPress={() => router.push(`/${username}/${repoName}/issues/new`)} className="mt-2 px-4 py-2 bg-blue-600 rounded-lg">
                  <Text className="text-white font-medium">New issue</Text>
                </Pressable>
              ) : undefined
            }
          />
        ) : (
          <View className="rounded-lg border border-gray-800 overflow-hidden">
            {issues.map((issue) => (
              <Link key={issue.id} href={`/${username}/${repoName}/issues/${issue.number}`} asChild>
                <Pressable className="flex-row items-start py-3 px-4 border-b border-gray-800 last:border-b-0 active:bg-white/5">
                  <View className="mt-0.5 mr-3">
                    <StateBadge state={issue.state === "open" ? "open" : "closed"} />
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="text-white text-sm font-semibold" numberOfLines={2}>
                      {issue.title}
                    </Text>
                    <Text className="text-gray-400 text-xs mt-1">
                      #{issue.number} opened {timeAgo(issue.createdAt)} by {issue.author?.username ?? issue.author?.name ?? "Unknown"}
                    </Text>
                    {issue.labels?.length > 0 && (
                      <View className="flex-row flex-wrap gap-1 mt-2">
                        {issue.labels.slice(0, 3).map((l) => (
                          <LabelBadge key={l.id} name={l.name} color={l.color} />
                        ))}
                      </View>
                    )}
                  </View>
                  <FontAwesome name="chevron-right" size={12} color="rgba(255,255,255,0.3)" className="mt-2" />
                </Pressable>
              </Link>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
