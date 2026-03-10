import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
  Switch,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import {
  useRepoWebhooks,
  useCreateRepoWebhook,
  useUpdateRepoWebhook,
  useDeleteRepoWebhook,
} from "@sigmagit/hooks";
import type { WebhookEvent } from "@sigmagit/hooks";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { EmptyState } from "@/components/ui/empty-state";

const EVENTS: WebhookEvent[] = ["push", "pull_request", "issues", "tag", "branch"];

export default function WebhooksScreen() {
  const { username, repo: repoName } = useLocalSearchParams<{ username: string; repo: string }>();
  const { data, isLoading, refetch, isRefetching } = useRepoWebhooks(username || "", repoName || "");
  const createWebhook = useCreateRepoWebhook(username || "", repoName || "");
  const updateWebhook = useUpdateRepoWebhook(username || "", repoName || "");
  const deleteWebhook = useDeleteRepoWebhook(username || "", repoName || "");

  const [modalVisible, setModalVisible] = useState(false);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<WebhookEvent[]>(["push"]);

  const webhooks = data?.webhooks ?? [];

  const toggleEvent = (ev: WebhookEvent) => {
    setEvents((prev) => (prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]));
  };

  const handleCreate = () => {
    if (!url.trim() || events.length === 0) {
      Alert.alert("Error", "Enter a URL and select at least one event.");
      return;
    }
    createWebhook.mutate(
      { url: url.trim(), events },
      {
        onSuccess: () => {
          setModalVisible(false);
          setUrl("");
          setEvents(["push"]);
          refetch();
        },
        onError: (e) => Alert.alert("Error", e.message),
      }
    );
  };

  const handleDelete = (hookId: string) => {
    Alert.alert("Delete webhook", "Remove this webhook?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          deleteWebhook.mutate(hookId, {
            onSuccess: () => refetch(),
            onError: (e) => Alert.alert("Error", e.message),
          }),
      },
    ]);
  };

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen
        options={{
          title: "Webhooks",
          headerRight: () => (
            <Pressable onPress={() => setModalVisible(true)} className="px-2">
              <FontAwesome name="plus" size={18} color="#60a5fa" />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#60a5fa" />
        }
      >
        {isLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#60a5fa" />
          </View>
        ) : webhooks.length === 0 ? (
          <EmptyState
            icon={<FontAwesome name="link" size={40} color="rgba(255,255,255,0.3)" />}
            title="No webhooks"
            description="Add a webhook to receive push, pull request, and other events."
          />
        ) : (
          webhooks.map((hook) => (
            <View
              key={hook.id}
              className="flex-row items-center justify-between py-4 border-b border-gray-800"
            >
              <View className="flex-1 min-w-0">
                <Text className="text-white font-mono text-sm" numberOfLines={1}>
                  {hook.url}
                </Text>
                <Text className="text-gray-400 text-xs mt-1">
                  {(hook.events ?? []).join(", ")} · {hook.active ? "Active" : "Inactive"}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Switch
                  value={hook.active}
                  onValueChange={() =>
                    updateWebhook.mutate(
                      { hookId: hook.id, data: { active: !hook.active } },
                      { onSuccess: () => refetch() }
                    )
                  }
                />
                <Pressable onPress={() => handleDelete(hook.id)} className="p-2">
                  <FontAwesome name="trash-o" size={18} color="#f87171" />
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/70">
          <View className="bg-gray-900 rounded-t-2xl p-6 max-h-[80%]">
            <Text className="text-white text-lg font-semibold mb-4">Add webhook</Text>
            <Text className="text-gray-400 text-sm mb-2">Payload URL</Text>
            <TextInput
              value={url}
              onChangeText={setUrl}
              placeholder="https://example.com/webhook"
              placeholderTextColor="#9ca3af"
              keyboardType="url"
              autoCapitalize="none"
              className="bg-white/5 border border-gray-700 rounded-lg px-4 py-3 text-white mb-4"
            />
            <Text className="text-gray-400 text-sm mb-2">Events</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {EVENTS.map((ev) => (
                <Pressable
                  key={ev}
                  onPress={() => toggleEvent(ev)}
                  className={`px-3 py-2 rounded-lg ${events.includes(ev) ? "bg-blue-600" : "bg-white/10"}`}
                >
                  <Text className={events.includes(ev) ? "text-white" : "text-gray-400"}>{ev}</Text>
                </Pressable>
              ))}
            </View>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setModalVisible(false)}
                className="flex-1 py-3 rounded-lg bg-white/10 items-center"
              >
                <Text className="text-white">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreate}
                disabled={!url.trim() || events.length === 0 || createWebhook.isPending}
                className="flex-1 py-3 rounded-lg bg-blue-600 items-center"
              >
                {createWebhook.isPending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-medium">Create</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
