import { View, Text, ScrollView, RefreshControl, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useDiscussions } from "@sigmagit/hooks";
import { timeAgo } from "@sigmagit/lib";
import { EmptyState } from "@/components/ui/empty-state";

export default function DiscussionsListScreen() {
  const { username, repo: repoName } = useLocalSearchParams<{ username: string; repo: string }>();
  const { data, isLoading, refetch, isRefetching } = useDiscussions(username || "", repoName || "", { limit: 30 });
  const discussions = data?.discussions ?? [];

  return (
    <View className="flex-1 bg-black">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#60a5fa" />}
      >
        {isLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#60a5fa" />
          </View>
        ) : discussions.length === 0 ? (
          <EmptyState
            icon={<FontAwesome name="comments-o" size={40} color="rgba(255,255,255,0.3)" />}
            title="No discussions"
            description="Start a discussion to ask the community."
          />
        ) : (
          discussions.map((d) => (
            <Pressable
              key={d.id}
              onPress={() => router.push(`/${username}/${repoName}/discussions/${d.number}`)}
              className="py-3 border-b border-gray-800 active:bg-white/5"
            >
              <Text className="text-white font-medium">{d.title}</Text>
              <Text className="text-gray-400 text-xs mt-1">{d.author?.username ?? "Unknown"} · {timeAgo(d.createdAt)}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}
