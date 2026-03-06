import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRelease } from "@sigmagit/hooks";
import { timeAgo } from "@sigmagit/lib";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

export default function ReleaseDetailScreen() {
  const { username, repo: repoName, id } = useLocalSearchParams<{ username: string; repo: string; id: string }>();

  const { data: release, isLoading, refetch, isRefetching } = useRelease(username || "", repoName || "", id || "");

  if (isLoading || !release) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Stack.Screen options={{ title: "Release" }} />
        <ActivityIndicator size="large" color="#60a5fa" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ title: release.name }} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-8"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#60a5fa" />}
      >
        <View className="py-4 border-b border-gray-800">
          <View className="flex-row items-center gap-2 mb-2">
            <FontAwesome name="tag" size={18} color="#60a5fa" />
            <Text className="text-blue-400 text-lg font-semibold">{release.tagName}</Text>
          </View>
          <Text className="text-white text-xl font-semibold">{release.name}</Text>
          {release.publishedAt && (
            <Text className="text-gray-400 text-sm mt-1">Released {timeAgo(release.publishedAt)}</Text>
          )}
        </View>
        {release.body && (
          <View className="py-4">
            <MarkdownRenderer content={release.body} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
