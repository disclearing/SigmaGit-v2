import { View, Text, ScrollView, RefreshControl } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useProject } from "@sigmagit/hooks";

export default function ProjectDetailScreen() {
  const { username, repo: repoName, id } = useLocalSearchParams<{ username: string; repo: string; id: string }>();
  const { data: project, isLoading, refetch, isRefetching } = useProject(id || "");

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ title: project?.name ?? "Project" }} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#60a5fa" />}
      >
        {project && <Text className="text-white">{project.name}</Text>}
      </ScrollView>
    </View>
  );
}
