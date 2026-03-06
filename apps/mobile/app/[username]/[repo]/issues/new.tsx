import { useState } from "react";
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { useCreateIssue } from "@sigmagit/hooks";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export default function NewIssueScreen() {
  const { username, repo: repoName } = useLocalSearchParams<{ username: string; repo: string }>();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const createIssue = useCreateIssue(username || "", repoName || "");

  const handleSubmit = () => {
    if (!title.trim()) return;
    createIssue.mutate(
      { title: title.trim(), body: body.trim() || undefined },
      {
        onSuccess: (issue) => {
          router.replace(`/${username}/${repoName}/issues/${issue.number}`);
        },
        onError: () => {},
      }
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-black">
      <Stack.Screen options={{ title: "New issue" }} />
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
            className="bg-white/5 border border-gray-700 rounded-lg px-3 py-3 text-white text-base min-h-[120px]"
            placeholder="Add a description..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={body}
            onChangeText={setBody}
            multiline
          />
        </View>
        <Pressable
          onPress={handleSubmit}
          disabled={!title.trim() || createIssue.isPending}
          className="py-3 bg-blue-600 rounded-lg items-center"
        >
          {createIssue.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold">Create issue</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
