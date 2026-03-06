import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useWorkflowRun } from "@sigmagit/hooks";
import { timeAgo } from "@sigmagit/lib";
import { Badge } from "@/components/ui/badge";

export default function RunDetailScreen() {
  const { username, repo: repoName, runId } = useLocalSearchParams<{ username: string; repo: string; runId: string }>();
  const { data, isLoading, refetch, isRefetching } = useWorkflowRun(username || "", repoName || "", runId || "");
  const run = data?.run;

  if (isLoading || !run) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Stack.Screen options={{ title: "Run" }} />
        <ActivityIndicator size="large" color="#60a5fa" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ title: run.name ?? run.id }} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-8"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#60a5fa" />}
      >
        <View className="py-4 border-b border-gray-800">
          <Badge variant={run.status === "success" ? "success" : run.status === "failure" ? "destructive" : "warning"}>{run.status}</Badge>
          <Text className="text-white font-semibold mt-2">{run.name}</Text>
          <Text className="text-gray-400 text-sm mt-1">{timeAgo(run.createdAt)}</Text>
        </View>
      </ScrollView>
    </View>
  );
}
