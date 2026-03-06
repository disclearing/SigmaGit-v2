import { View, Text, ScrollView, RefreshControl, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { useState } from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { usePullRequest, usePullRequestDiff, useMergePullRequest } from "@sigmagit/hooks";
import { timeAgo } from "@sigmagit/lib";
import { StateBadge } from "@/components/ui/state-badge";
import { LabelBadge } from "@/components/ui/label-badge";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
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

export default function PullRequestDetailScreen() {
  const { username, repo: repoName, number } = useLocalSearchParams<{ username: string; repo: string; number: string }>();
  const num = number ? parseInt(number, 10) : 0;
  const [activeTab, setActiveTab] = useState<"conversation" | "changes">("conversation");

  const { data: pr, isLoading, refetch, isRefetching } = usePullRequest(username || "", repoName || "", num);
  const { data: diffData } = usePullRequestDiff(pr?.id ?? "");
  const mergePr = useMergePullRequest(pr?.id ?? "", username || "", repoName || "", pr?.number ?? 0);

  if (isLoading || !pr) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Stack.Screen options={{ title: `#${number}` }} />
        <ActivityIndicator size="large" color="#60a5fa" />
      </View>
    );
  }

  const canMerge = pr.state === "open" && !pr.merged;
  const diffContent = diffData?.files?.length ? buildDiffString(diffData.files) : "";

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ title: `#${pr.number}` }} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-8"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#60a5fa" />}
      >
        <View className="py-4 border-b border-gray-800">
          <View className="flex-row items-center gap-2 mb-2">
            <StateBadge state={pr.merged ? "merged" : pr.state === "open" ? "open" : "closed"} />
            <Text className="text-gray-400 text-sm">#{pr.number}</Text>
          </View>
          <Text className="text-white text-lg font-semibold">{pr.title}</Text>
          <Text className="text-gray-400 text-sm mt-1">
            {pr.author?.username ?? pr.author?.name ?? "Unknown"} opened {timeAgo(pr.createdAt)}
          </Text>
          {pr.labels?.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mt-2">
              {pr.labels.map((l) => (
                <LabelBadge key={l.id} name={l.name} color={l.color} />
              ))}
            </View>
          )}
          {canMerge && (
            <Pressable
              onPress={() => mergePr.mutate(undefined, { onSuccess: () => refetch() })}
              disabled={mergePr.isPending}
              className="mt-4 py-2 bg-green-600 rounded-lg items-center"
            >
              <Text className="text-white font-medium">{mergePr.isPending ? "Merging..." : "Merge"}</Text>
            </Pressable>
          )}
        </View>

        <View className="flex-row gap-2 my-2">
          <Pressable
            onPress={() => setActiveTab("conversation")}
            className={`px-3 py-2 rounded-lg ${activeTab === "conversation" ? "bg-white/10" : ""}`}
          >
            <Text className="text-white font-medium">Conversation</Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("changes")}
            className={`px-3 py-2 rounded-lg ${activeTab === "changes" ? "bg-white/10" : ""}`}
          >
            <Text className="text-white font-medium">Changes</Text>
          </Pressable>
        </View>

        {activeTab === "conversation" && pr.body && (
          <View className="py-4">
            <MarkdownRenderer content={pr.body} />
          </View>
        )}

        {activeTab === "changes" && (
          <View className="py-4">
            {diffContent ? <DiffViewer content={diffContent} /> : <Text className="text-gray-400">No diff loaded</Text>}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
