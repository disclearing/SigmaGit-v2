import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRepositoryInfo, useDeleteRepository } from "@sigmagit/hooks";
import { useSession } from "@/lib/auth-client";

const rows = [
  { label: "General", icon: "cog", routeKey: "general-settings" },
  { label: "Collaborators", icon: "users", routeKey: "collaborators" },
  { label: "Branch protection", icon: "lock", routeKey: "branch-protection" },
  { label: "Webhooks", icon: "link", routeKey: "webhooks" },
  { label: "Danger zone", icon: "exclamation-triangle", routeKey: "danger", destructive: true },
];

export default function RepoSettingsScreen() {
  const { username, repo: repoName } = useLocalSearchParams<{ username: string; repo: string }>();
  const { data: session } = useSession();
  const { data: repoInfo } = useRepositoryInfo(username || "", repoName || "");
  const repo = repoInfo?.repo;
  const deleteRepo = useDeleteRepository(repo?.id ?? "");
  const isOwner = session?.user?.id && repo?.ownerId === session.user.id;

  const handleRowPress = (routeKey: string) => {
    if (routeKey === "danger") {
      handleDelete();
      return;
    }
    router.push(`/${username}/${repoName}/${routeKey}` as any);
  };

  const handleDelete = () => {
    if (!repo) return;
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
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}>
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

        {rows.map((r) => (
          <Pressable
            key={r.routeKey}
            onPress={() => handleRowPress(r.routeKey)}
            className="flex-row items-center py-4 border-b border-gray-800 active:bg-white/5"
          >
            <View className="w-10 h-10 rounded-lg bg-white/10 items-center justify-center mr-4">
              <FontAwesome
                name={r.icon as any}
                size={18}
                color={r.destructive ? "#f87171" : "rgba(255,255,255,0.8)"}
              />
            </View>
            <Text className={`flex-1 text-base font-medium ${r.destructive ? "text-red-400" : "text-white"}`}>
              {r.label}
            </Text>
            <FontAwesome name="chevron-right" size={14} color="rgba(255,255,255,0.4)" />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
