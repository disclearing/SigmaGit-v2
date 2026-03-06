import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useCommitDiff } from "@sigmagit/hooks";
import { timeAgo } from "@sigmagit/lib";
import { DiffViewer } from "@/components/ui/diff-viewer";
import type { FileDiff } from "@sigmagit/hooks";

function buildDiffString(files: FileDiff[]): string {
  const lines: string[] = [];
  for (const file of files) {
    lines.push(`--- a/${file.path}`);
    lines.push(`+++ b/${file.path}`);
    for (const hunk of file.hunks) {
      lines.push(`@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`);
      for (const line of hunk.lines) {
        const prefix = line.type === "addition" ? "+" : line.type === "deletion" ? "-" : " ";
        lines.push(prefix + line.content);
      }
    }
  }
  return lines.join("\n");
}

export default function CommitDetailScreen() {
  const { username, repo: repoName, oid } = useLocalSearchParams<{ username: string; repo: string; oid: string }>();
  const { data: repoInfo } = useRepositoryInfo(username || "", repoName || "");
  const { data: diffData, isLoading, refetch, isRefetching } = useCommitDiff(username || "", repoName || "", oid || "");

  const commit = diffData?.commit;
  const diff = diffData?.diff ?? "";

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen
        options={{
          title: oid?.slice(0, 7) ?? "Commit",
          headerShown: true,
        }}
      />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-8"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#60a5fa" />}
      >
        {commit && (
          <View className="mb-4 p-4 rounded-lg bg-white/5 border border-gray-800">
            <Text className="text-white text-base font-semibold">{commit.message?.split("\n")[0]}</Text>
            <View className="flex-row items-center mt-2">
              <View className="w-6 h-6 rounded-full bg-gray-600 items-center justify-center">
                <Text className="text-white text-xs">{(commit.author?.name || "?")[0]}</Text>
              </View>
              <Text className="text-gray-400 text-sm ml-2">
                {commit.author?.name ?? "Unknown"} · {timeAgo(commit.timestamp)}
              </Text>
            </View>
            <Text className="text-gray-500 text-xs font-mono mt-2">{oid}</Text>
          </View>
        )}
        {isLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#60a5fa" />
          </View>
        ) : diffData?.files?.length ? (
          <DiffViewer content={buildDiffString(diffData.files)} />
        ) : (
          <Text className="text-gray-400 text-sm">No diff available</Text>
        )}
      </ScrollView>
    </View>
  );
}
