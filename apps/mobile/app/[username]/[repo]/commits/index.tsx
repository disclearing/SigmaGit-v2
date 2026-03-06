import { useState } from "react";
import { View, Text, ScrollView, RefreshControl, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, Link, router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRepositoryInfo, useRepoBranches, useRepoCommits } from "@sigmagit/hooks";
import { timeAgo } from "@sigmagit/lib";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";

export default function CommitsScreen() {
  const { username, repo: repoName } = useLocalSearchParams<{ username: string; repo: string }>();
  const [branch, setBranch] = useState<string | null>(null);
  const { data: repoInfo } = useRepositoryInfo(username || "", repoName || "");
  const defaultBranch = repoInfo?.repo?.defaultBranch || "main";
  const currentBranch = branch ?? defaultBranch;

  const { data: branchesData } = useRepoBranches(username || "", repoName || "");
  const {
    data: commitsData,
    isLoading,
    refetch,
    isRefetching,
  } = useRepoCommits(username || "", repoName || "", currentBranch, 50, 0);

  const commits = commitsData?.commits ?? [];
  const branchNames = branchesData?.branches ?? [];

  const tabItems: TabItem[] = [
    { key: "code", label: "Code" },
    { key: "commits", label: "Commits" },
    { key: "issues", label: "Issues" },
    { key: "pulls", label: "Pull requests" },
    { key: "releases", label: "Releases" },
  ];

  return (
    <View className="flex-1 bg-black">
      <View className="px-4 pt-2 pb-2 border-b border-gray-800">
        <Tabs
          tabs={tabItems}
          activeKey="commits"
          onSelect={(key) => {
            if (key === "code") router.push(`/${username}/${repoName}`);
            else if (key === "issues") router.push(`/${username}/${repoName}/issues`);
            else if (key === "pulls") router.push(`/${username}/${repoName}/pulls`);
            else if (key === "releases") router.push(`/${username}/${repoName}/releases`);
          }}
        />
      </View>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#60a5fa" />}
      >
        {branchNames.length > 1 && (
          <View className="mb-4 flex-row items-center gap-2">
            <Text className="text-gray-400 text-sm">Branch:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
              {branchNames.slice(0, 10).map((name) => (
                <Pressable
                  key={name}
                  onPress={() => setBranch(name)}
                  className={`mr-2 px-3 py-1.5 rounded-lg ${name === currentBranch ? "bg-blue-600" : "bg-white/10"}`}
                >
                  <Text className="text-sm font-medium text-white">{name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
        {isLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#60a5fa" />
          </View>
        ) : commits.length === 0 ? (
          <EmptyState
            icon={<FontAwesome name="git" size={40} color="rgba(255,255,255,0.3)" />}
            title="No commits yet"
            description="Commits on this branch will appear here."
          />
        ) : (
          <View className="rounded-lg border border-gray-800 overflow-hidden">
            {commits.map((c) => (
              <Link key={c.oid} href={`/${username}/${repoName}/commits/${c.oid}`} asChild>
                <Pressable className="flex-row items-center py-3 px-4 border-b border-gray-800 last:border-b-0 active:bg-white/5">
                  <View className="w-8 h-8 rounded-full bg-gray-700 items-center justify-center mr-3">
                    <Text className="text-white text-xs font-bold">{(c.author?.name || "?")[0]}</Text>
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="text-white text-sm font-medium" numberOfLines={1}>
                      {c.message?.split("\n")[0] ?? c.oid.slice(0, 7)}
                    </Text>
                    <Text className="text-gray-400 text-xs mt-0.5">
                      {c.author?.name ?? "Unknown"} · {timeAgo(c.timestamp)}
                    </Text>
                  </View>
                  <Text className="text-gray-500 text-xs font-mono ml-2">{c.oid.slice(0, 7)}</Text>
                  <FontAwesome name="chevron-right" size={12} color="rgba(255,255,255,0.3)" />
                </Pressable>
              </Link>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
