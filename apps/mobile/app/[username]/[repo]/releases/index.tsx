import { View, Text, ScrollView, RefreshControl, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, Link, router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRepositoryInfo, useReleases } from "@sigmagit/hooks";
import { timeAgo } from "@sigmagit/lib";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";

export default function ReleasesListScreen() {
  const { username, repo: repoName } = useLocalSearchParams<{ username: string; repo: string }>();

  const { data: repoInfo } = useRepositoryInfo(username || "", repoName || "");
  const { data: releasesData, isLoading, refetch, isRefetching } = useReleases(username || "", repoName || "", false);

  const releases = releasesData?.releases ?? [];

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
          activeKey="releases"
          onSelect={(key) => {
            if (key === "code") router.push(`/${username}/${repoName}`);
            else if (key === "commits") router.push(`/${username}/${repoName}/commits`);
            else if (key === "issues") router.push(`/${username}/${repoName}/issues`);
            else if (key === "pulls") router.push(`/${username}/${repoName}/pulls`);
          }}
        />
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
        ) : releases.length === 0 ? (
          <EmptyState
            icon={<FontAwesome name="tag" size={40} color="rgba(255,255,255,0.3)" />}
            title="No releases yet"
            description="Releases will appear here when they're published."
          />
        ) : (
          <View className="rounded-lg border border-gray-800 overflow-hidden">
            {releases.map((r) => (
              <Link key={r.id} href={`/${username}/${repoName}/releases/${r.id}`} asChild>
                <Pressable className="py-4 px-4 border-b border-gray-800 last:border-b-0 active:bg-white/5">
                  <View className="flex-row items-center gap-2 mb-1">
                    <FontAwesome name="tag" size={14} color="#60a5fa" />
                    <Text className="text-blue-400 font-semibold">{r.tagName}</Text>
                  </View>
                  <Text className="text-white text-base font-semibold">{r.name}</Text>
                  {r.publishedAt && (
                    <Text className="text-gray-400 text-xs mt-1">Released {timeAgo(r.publishedAt)}</Text>
                  )}
                </Pressable>
              </Link>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
