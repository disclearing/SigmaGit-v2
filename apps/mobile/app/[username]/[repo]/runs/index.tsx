import { View, Text, ScrollView, RefreshControl, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useWorkflowRuns } from "@sigmagit/hooks";
import { timeAgo } from "@sigmagit/lib";
import { Badge } from "@/components/ui/badge";

export default function RunsListScreen() {
  const { username, repo: repoName } = useLocalSearchParams<{ username: string; repo: string }>();
  const { data, isLoading, refetch, isRefetching } = useWorkflowRuns(username || "", repoName || "", 1);
  const runs = data?.runs ?? [];

  const statusVariant = (status: string) => {
    if (status === "success" || status === "completed") return "success";
    if (status === "failure" || status === "cancelled") return "destructive";
    return "warning";
  };

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
        ) : runs.length === 0 ? (
          <View className="py-12">
            <Text className="text-gray-400 text-center">No runs yet</Text>
          </View>
        ) : (
          runs.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => router.push(`/${username}/${repoName}/runs/${r.id}`)}
              className="py-3 border-b border-gray-800 active:bg-white/5 flex-row items-center justify-between"
            >
              <View>
                <Text className="text-white font-medium">{r.name ?? r.workflowId}</Text>
                <Text className="text-gray-400 text-xs mt-1">{timeAgo(r.createdAt)}</Text>
              </View>
              <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}
