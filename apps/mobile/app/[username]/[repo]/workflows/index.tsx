import { View, Text, ScrollView, RefreshControl, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useWorkflows } from "@sigmagit/hooks";
import { EmptyState } from "@/components/ui/empty-state";

export default function WorkflowsListScreen() {
  const { username, repo: repoName } = useLocalSearchParams<{ username: string; repo: string }>();
  const { data, isLoading, refetch, isRefetching } = useWorkflows(username || "", repoName || "");
  const workflows = data?.workflows ?? [];

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
        ) : workflows.length === 0 ? (
          <EmptyState
            icon={<FontAwesome name="play-circle-o" size={40} color="rgba(255,255,255,0.3)" />}
            title="No workflows"
            description="Add workflow files to .github/workflows to see them here."
          />
        ) : (
          workflows.map((w) => (
            <View key={w.id} className="py-3 border-b border-gray-800">
              <Text className="text-white font-medium">{w.name ?? w.path}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
