import { View, Text, ScrollView, RefreshControl } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useDiscussion } from "@sigmagit/hooks";
import { timeAgo } from "@sigmagit/lib";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

export default function DiscussionDetailScreen() {
  const { username, repo: repoName, number } = useLocalSearchParams<{ username: string; repo: string; number: string }>();
  const num = number ? parseInt(number, 10) : 0;
  const { data: discussion, isLoading, refetch, isRefetching } = useDiscussion(username || "", repoName || "", num);

  if (isLoading || !discussion) {
    return null;
  }

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ title: discussion.title }} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-8"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#60a5fa" />}
      >
        <Text className="text-gray-400 text-sm mb-2">{discussion.author?.username ?? "Unknown"} · {timeAgo(discussion.createdAt)}</Text>
        {discussion.body && <MarkdownRenderer content={discussion.body} />}
      </ScrollView>
    </View>
  );
}
