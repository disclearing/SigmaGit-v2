import { useState } from "react";
import { View, Text, ScrollView, RefreshControl, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, Link, router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRepositoryInfo, usePullRequests, usePullRequestCount } from "@sigmagit/hooks";
import { timeAgo } from "@sigmagit/lib";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { StateBadge } from "@/components/ui/state-badge";
import { LabelBadge } from "@/components/ui/label-badge";
import { EmptyState } from "@/components/ui/empty-state";

export default function PullRequestsListScreen() {
  const { username, repo: repoName } = useLocalSearchParams<{ username: string; repo: string }>();
  const [stateFilter, setStateFilter] = useState<"open" | "closed" | "merged" | "all">("open");

  const { data: repoInfo } = useRepositoryInfo(username || "", repoName || "");
  const { data: countData } = usePullRequestCount(username || "", repoName || "");
  const { data: prsData, isLoading, refetch, isRefetching } = usePullRequests(username || "", repoName || "", {
    state: stateFilter,
    limit: 50,
  });

  const pullRequests = prsData?.pullRequests ?? [];

  const tabItems: TabItem[] = [
    { key: "code", label: "Code" },
    { key: "commits", label: "Commits" },
    { key: "issues", label: "Issues" },
    { key: "pulls", label: "Pull requests" },
    { key: "releases", label: "Releases" },
  ];

  const prState = (pr: { state: string; merged?: boolean }) =>
    pr.merged ? "merged" : pr.state === "open" ? "open" : "closed";

  return (
    <View className="flex-1 bg-black">
      <View className="px-4 pt-2 pb-2 border-b border-gray-800">
        <Tabs
          tabs={tabItems}
          activeKey="pulls"
          onSelect={(key) => {
            if (key === "code") router.push(`/${username}/${repoName}`);
            else if (key === "commits") router.push(`/${username}/${repoName}/commits`);
            else if (key === "issues") router.push(`/${username}/${repoName}/issues`);
            else if (key === "releases") router.push(`/${username}/${repoName}/releases`);
          }}
        />
        <View className="flex-row gap-2 mt-2">
          {(["open", "closed", "merged"] as const).map((s) => (
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
        ) : pullRequests.length === 0 ? (
          <EmptyState
            icon={<FontAwesome name="code-fork" size={40} color="rgba(255,255,255,0.3)" />}
            title={stateFilter === "open" ? "No open pull requests" : "No pull requests"}
            description="Create a pull request to propose changes."
            action={
              stateFilter === "open" ? (
                <Pressable onPress={() => router.push(`/${username}/${repoName}/pulls/new`)} className="mt-2 px-4 py-2 bg-blue-600 rounded-lg">
                  <Text className="text-white font-medium">New pull request</Text>
                </Pressable>
              ) : undefined
            }
          />
        ) : (
          <View className="rounded-lg border border-gray-800 overflow-hidden">
            {pullRequests.map((pr) => (
              <Link key={pr.id} href={`/${username}/${repoName}/pulls/${pr.number}`} asChild>
                <Pressable className="flex-row items-start py-3 px-4 border-b border-gray-800 last:border-b-0 active:bg-white/5">
                  <View className="mt-0.5 mr-3">
                    <StateBadge state={prState(pr)} />
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="text-white text-sm font-semibold" numberOfLines={2}>
                      {pr.title}
                    </Text>
                    <Text className="text-gray-400 text-xs mt-1">
                      #{pr.number} by {pr.author?.username ?? pr.author?.name ?? "Unknown"} · {timeAgo(pr.createdAt)}
                    </Text>
                    {pr.labels?.length > 0 && (
                      <View className="flex-row flex-wrap gap-1 mt-2">
                        {pr.labels.slice(0, 3).map((l) => (
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
