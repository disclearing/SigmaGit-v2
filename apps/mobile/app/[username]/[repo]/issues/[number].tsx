import { View, Text, ScrollView, RefreshControl, Pressable, ActivityIndicator, TextInput } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useState } from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useIssue, useIssueComments, useCreateComment } from "@sigmagit/hooks";
import { timeAgo } from "@sigmagit/lib";
import { StateBadge } from "@/components/ui/state-badge";
import { LabelBadge } from "@/components/ui/label-badge";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

export default function IssueDetailScreen() {
  const { username, repo: repoName, number } = useLocalSearchParams<{ username: string; repo: string; number: string }>();
  const num = number ? parseInt(number, 10) : 0;
  const [newComment, setNewComment] = useState("");

  const { data: issue, isLoading, refetch, isRefetching } = useIssue(username || "", repoName || "", num);
  const { data: commentsData } = useIssueComments(issue?.id ?? "");
  const createComment = useCreateComment(issue?.id ?? "");

  const comments = commentsData?.comments ?? [];

  const handleSubmitComment = () => {
    if (!newComment.trim() || !issue) return;
    createComment.mutate(newComment.trim(), {
      onSuccess: () => setNewComment(""),
    });
  };

  if (isLoading || !issue) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Stack.Screen options={{ title: `#${number}` }} />
        <ActivityIndicator size="large" color="#60a5fa" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ title: `#${issue.number} ${issue.title.slice(0, 20)}...` }} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-8"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#60a5fa" />}
      >
        <View className="py-4 border-b border-gray-800">
          <View className="flex-row items-center gap-2 mb-2">
            <StateBadge state={issue.state === "open" ? "open" : "closed"} />
            <Text className="text-gray-400 text-sm">#{issue.number}</Text>
          </View>
          <Text className="text-white text-lg font-semibold">{issue.title}</Text>
          <Text className="text-gray-400 text-sm mt-1">
            {issue.author?.username ?? issue.author?.name ?? "Unknown"} opened {timeAgo(issue.createdAt)}
          </Text>
          {issue.labels?.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mt-2">
              {issue.labels.map((l) => (
                <LabelBadge key={l.id} name={l.name} color={l.color} />
              ))}
            </View>
          )}
        </View>

        {issue.body && (
          <View className="py-4 border-b border-gray-800">
            <MarkdownRenderer content={issue.body} />
          </View>
        )}

        <Text className="text-white font-semibold mt-4 mb-2">{comments.length} comments</Text>
        {comments.map((c) => (
          <View key={c.id} className="py-3 border-b border-gray-800">
            <View className="flex-row items-center gap-2 mb-1">
              <Text className="text-white font-medium text-sm">{c.author?.username ?? c.author?.name ?? "Unknown"}</Text>
              <Text className="text-gray-500 text-xs">{timeAgo(c.createdAt)}</Text>
            </View>
            <MarkdownRenderer content={c.body ?? ""} />
          </View>
        ))}

        <View className="mt-4">
          <Text className="text-gray-400 text-sm mb-2">Add a comment</Text>
          <TextInput
            className="bg-white/5 border border-gray-700 rounded-lg p-3 text-white text-sm min-h-[80px]"
            placeholder="Write a comment..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
          <Pressable
            onPress={handleSubmitComment}
            disabled={!newComment.trim() || createComment.isPending}
            className="mt-2 py-2 bg-blue-600 rounded-lg items-center"
          >
            <Text className="text-white font-medium">{createComment.isPending ? "Posting..." : "Comment"}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
