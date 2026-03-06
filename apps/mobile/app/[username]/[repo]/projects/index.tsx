import { View, Text, ScrollView, RefreshControl, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useProjects } from "@sigmagit/hooks";
import { EmptyState } from "@/components/ui/empty-state";

export default function ProjectsListScreen() {
  const { username, repo: repoName } = useLocalSearchParams<{ username: string; repo: string }>();
  const { data, isLoading, refetch, isRefetching } = useProjects(username || "", repoName || "");
  const projects = data?.projects ?? [];

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
        ) : projects.length === 0 ? (
          <EmptyState
            icon={<FontAwesome name="columns" size={40} color="rgba(255,255,255,0.3)" />}
            title="No projects"
            description="Create a project board to track work."
          />
        ) : (
          projects.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => router.push(`/${username}/${repoName}/projects/${p.id}`)}
              className="py-3 border-b border-gray-800 active:bg-white/5"
            >
              <Text className="text-white font-medium">{p.name}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}
