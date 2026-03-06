import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRepositoryInfo, useDeleteRepository } from "@sigmagit/hooks";
import { useSession } from "@/lib/auth-client";

export default function RepoSettingsScreen() {
  const { username, repo: repoName } = useLocalSearchParams<{ username: string; repo: string }>();
  const { data: session } = useSession();
  const { data: repoInfo } = useRepositoryInfo(username || "", repoName || "");
  const deleteRepo = useDeleteRepository(repo?.id ?? "");

  const repo = repoInfo?.repo;
  const isOwner = session?.user?.id && repo?.ownerId === session.user.id;

  const handleDelete = () => {
    Alert.alert(
      "Delete repository",
      `Are you sure you want to delete ${username}/${repoName}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteRepo.mutate(undefined, {
              onSuccess: () => {},
              onError: (e) => Alert.alert("Error", e.message),
            });
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ title: "Settings" }} />
      <ScrollView className="flex-1" contentContainerClassName="px-4 py-4">
        {repo && (
          <View className="mb-6 p-4 rounded-lg bg-white/5 border border-gray-800">
            <Text className="text-white font-semibold text-lg">{repo.name}</Text>
            {repo.description && (
              <Text className="text-gray-400 text-sm mt-1">{repo.description}</Text>
            )}
            <View className="flex-row items-center mt-2">
              <View className={`px-2 py-1 rounded ${repo.visibility === "private" ? "bg-amber-500/20" : "bg-green-500/20"}`}>
                <Text className={`text-xs font-medium ${repo.visibility === "private" ? "text-amber-400" : "text-green-400"}`}>
                  {repo.visibility}
                </Text>
              </View>
            </View>
          </View>
        )}

        <Text className="text-gray-400 text-sm font-semibold mb-2">Danger zone</Text>
        {isOwner && (
          <Pressable onPress={handleDelete} disabled={deleteRepo.isPending} className="py-4 px-4 rounded-lg border border-red-500/50 bg-red-500/10">
            <Text className="text-red-400 font-medium">Delete repository</Text>
            <Text className="text-gray-400 text-xs mt-1">Permanently delete this repository and its data.</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
