import { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { useRepositoryInfo, useUpdateRepository } from "@sigmagit/hooks";

export default function GeneralSettingsScreen() {
  const { username, repo: repoName } = useLocalSearchParams<{ username: string; repo: string }>();
  const { data: repoInfo, isLoading } = useRepositoryInfo(username || "", repoName || "");
  const repo = repoInfo?.repo;
  const updateRepo = useUpdateRepository(repo?.id ?? "");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (repo) {
      setName(repo.name);
      setDescription(repo.description ?? "");
    }
  }, [repo]);

  const hasChanges = repo && (name !== repo.name || description !== (repo.description ?? ""));

  const handleSave = () => {
    if (!repo || !hasChanges) return;
    updateRepo.mutate(
      { name, description, visibility: repo.visibility },
      {
        onSuccess: (updated) => {
          if (updated?.name && updated.name !== repoName) {
            router.replace(`/${username}/${updated.name}/general-settings` as any);
          }
        },
        onError: (e) => Alert.alert("Error", e.message),
      }
    );
  };

  if (isLoading || !repo) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#60a5fa" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ title: "General" }} />
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        <View className="mb-4">
          <Text className="text-gray-400 text-sm mb-2">Repository name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            className="bg-white/5 border border-gray-800 rounded-lg px-4 py-3 text-white text-base"
            placeholderTextColor="#9ca3af"
            placeholder="Repository name"
          />
        </View>
        <View className="mb-4">
          <Text className="text-gray-400 text-sm mb-2">Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            className="bg-white/5 border border-gray-800 rounded-lg px-4 py-3 text-white text-base"
            placeholderTextColor="#9ca3af"
            placeholder="Description"
            multiline
            numberOfLines={3}
          />
        </View>
        <View className="mb-2">
          <Text className="text-gray-400 text-sm mb-2">Visibility</Text>
          <View className={`px-4 py-3 rounded-lg border ${repo.visibility === "private" ? "bg-amber-500/10 border-amber-500/30" : "bg-green-500/10 border-green-500/30"}`}>
            <Text className={repo.visibility === "private" ? "text-amber-400" : "text-green-400"}>{repo.visibility}</Text>
          </View>
          <Text className="text-gray-500 text-xs mt-1">Visibility can be changed from the web app.</Text>
        </View>
        <Pressable
          onPress={handleSave}
          disabled={!hasChanges || updateRepo.isPending}
          className="mt-4 bg-blue-600 py-3 rounded-lg items-center"
        >
          {updateRepo.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-medium">Save changes</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}
