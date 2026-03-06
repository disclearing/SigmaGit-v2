import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useGist } from "@sigmagit/hooks";
import { timeAgo } from "@sigmagit/lib";
import { CodeViewer } from "@/components/code-viewer";
import { getLanguage } from "@sigmagit/lib";

export default function GistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: gist, isLoading, refetch, isRefetching } = useGist(id || "");

  if (isLoading || !gist) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Stack.Screen options={{ title: "Gist" }} />
        <ActivityIndicator size="large" color="#60a5fa" />
      </View>
    );
  }

  const firstFile = gist.files?.[0];

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ title: gist.description || "Gist" }} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-8"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#60a5fa" />}
      >
        <View className="py-2 mb-2">
          <Text className="text-gray-400 text-sm">{gist.owner?.username ?? "Unknown"} · {timeAgo(gist.createdAt)}</Text>
        </View>
        {firstFile && (
          <View className="rounded-lg border border-gray-800 overflow-hidden">
            <View className="px-3 py-2 bg-white/5 border-b border-gray-800">
              <Text className="text-white font-medium text-sm">{firstFile.filename}</Text>
            </View>
            <CodeViewer content={firstFile.content} language={getLanguage(firstFile.filename)} filename={firstFile.filename} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
