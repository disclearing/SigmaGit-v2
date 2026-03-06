import { useState } from "react";
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { useRepoBranches, useCreatePullRequest } from "@sigmagit/hooks";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export default function NewPullRequestScreen() {
  const { username, repo: repoName } = useLocalSearchParams<{ username: string; repo: string }>();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [headBranch, setHeadBranch] = useState("");
  const [baseBranch, setBaseBranch] = useState("main");

  const { data: branchesData } = useRepoBranches(username || "", repoName || "");
  const createPr = useCreatePullRequest(username || "", repoName || "");
  const branches = branchesData?.branches ?? [];

  const handleSubmit = () => {
    if (!title.trim() || !headBranch) return;
    createPr.mutate(
      {
        title: title.trim(),
        body: body.trim() || undefined,
        headBranch,
        baseBranch: baseBranch || undefined,
      },
      {
        onSuccess: (pr) => {
          router.replace(`/${username}/${repoName}/pulls/${pr.number}`);
        },
      }
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-black">
      <Stack.Screen options={{ title: "New pull request" }} />
      <ScrollView className="flex-1" contentContainerClassName="p-4" keyboardShouldPersistTaps="handled">
        <View className="mb-4">
          <Text className="text-gray-200 text-sm font-semibold mb-2">Title</Text>
          <TextInput
            className="bg-white/5 border border-gray-700 rounded-lg px-3 py-3 text-white text-base"
            placeholder="Title"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={title}
            onChangeText={setTitle}
          />
        </View>
        <View className="mb-4">
          <Text className="text-gray-200 text-sm font-semibold mb-2">Description (optional)</Text>
          <TextInput
            className="bg-white/5 border border-gray-700 rounded-lg px-3 py-3 text-white text-base min-h-[100px]"
            placeholder="Describe your changes..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={body}
            onChangeText={setBody}
            multiline
          />
        </View>
        <View className="mb-4">
          <Text className="text-gray-200 text-sm font-semibold mb-2">Base branch</Text>
          <View className="flex-row flex-wrap gap-2">
            {branches.slice(0, 8).map((b) => (
              <Pressable
                key={b}
                onPress={() => setBaseBranch(b)}
                className={`px-3 py-2 rounded-lg ${baseBranch === b ? "bg-blue-600" : "bg-white/10"}`}
              >
                <Text className="text-white text-sm">{b}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View className="mb-4">
          <Text className="text-gray-200 text-sm font-semibold mb-2">Compare branch (head)</Text>
          <View className="flex-row flex-wrap gap-2">
            {branches.map((b) => (
              <Pressable
                key={b}
                onPress={() => setHeadBranch(b)}
                className={`px-3 py-2 rounded-lg ${headBranch === b ? "bg-blue-600" : "bg-white/10"}`}
              >
                <Text className="text-white text-sm">{b}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <Pressable
          onPress={handleSubmit}
          disabled={!title.trim() || !headBranch || createPr.isPending}
          className="py-3 bg-blue-600 rounded-lg items-center"
        >
          {createPr.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold">Create pull request</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
