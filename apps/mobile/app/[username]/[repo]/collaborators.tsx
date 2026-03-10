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
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import {
  useCollaborators,
  useAddCollaborator,
  useUpdateCollaborator,
  useRemoveCollaborator,
} from "@sigmagit/hooks";
import type { CollaboratorPermission } from "@sigmagit/hooks";
import { timeAgo } from "@sigmagit/lib";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { EmptyState } from "@/components/ui/empty-state";

const PERMISSIONS: CollaboratorPermission[] = ["read", "write", "admin"];

export default function CollaboratorsScreen() {
  const { username, repo: repoName } = useLocalSearchParams<{ username: string; repo: string }>();
  const { data, isLoading, refetch, isRefetching } = useCollaborators(username || "", repoName || "");
  const addCollaborator = useAddCollaborator(username || "", repoName || "");
  const updateCollaborator = useUpdateCollaborator(username || "", repoName || "");
  const removeCollaborator = useRemoveCollaborator(username || "", repoName || "");

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [permission, setPermission] = useState<CollaboratorPermission>("read");

  const collaborators = data?.collaborators ?? [];

  const handleAdd = () => {
    const trimmed = usernameInput.trim();
    if (!trimmed) return;
    addCollaborator.mutate(
      { username: trimmed, permission },
      {
        onSuccess: () => {
          setAddModalVisible(false);
          setUsernameInput("");
          setPermission("read");
          refetch();
        },
        onError: (e) => Alert.alert("Error", e.message),
      }
    );
  };

  const handleRemove = (c: (typeof collaborators)[0]) => {
    Alert.alert("Remove collaborator", `Remove ${c.user.username}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () =>
          removeCollaborator.mutate(c.user.id, {
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
          title: "Collaborators",
          headerRight: () => (
            <Pressable onPress={() => setAddModalVisible(true)} className="px-2">
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
        ) : collaborators.length === 0 ? (
          <EmptyState
            icon={<FontAwesome name="users" size={40} color="rgba(255,255,255,0.3)" />}
            title="No collaborators"
            description="Add people to give them access to this repository."
          />
        ) : (
          collaborators.map((c) => (
            <View
              key={c.user.id}
              className="flex-row items-center justify-between py-4 border-b border-gray-800"
            >
              <View className="flex-1">
                <Text className="text-white font-medium">{c.user.username}</Text>
                <Text className="text-gray-400 text-xs mt-0.5">
                  {c.permission} · added {timeAgo(c.addedAt)}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={() => {
                    const next: CollaboratorPermission = c.permission === "read" ? "write" : c.permission === "write" ? "admin" : "read";
                    updateCollaborator.mutate(
                      { userId: c.user.id, permission: next },
                      { onSuccess: () => refetch() }
                    );
                  }}
                  className="px-3 py-1.5 rounded bg-white/10"
                >
                  <Text className="text-white text-sm">{c.permission}</Text>
                </Pressable>
                <Pressable onPress={() => handleRemove(c)} className="p-2">
                  <FontAwesome name="trash-o" size={18} color="#f87171" />
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={addModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/70">
          <View className="bg-gray-900 rounded-t-2xl p-6">
            <Text className="text-white text-lg font-semibold mb-4">Add collaborator</Text>
            <TextInput
              value={usernameInput}
              onChangeText={setUsernameInput}
              placeholder="Username"
              placeholderTextColor="#9ca3af"
              className="bg-white/5 border border-gray-700 rounded-lg px-4 py-3 text-white mb-4"
            />
            <Text className="text-gray-400 text-sm mb-2">Permission</Text>
            <View className="flex-row gap-2 mb-6">
              {PERMISSIONS.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setPermission(p)}
                  className={`px-4 py-2 rounded-lg ${permission === p ? "bg-blue-600" : "bg-white/10"}`}
                >
                  <Text className={permission === p ? "text-white" : "text-gray-400"}>{p}</Text>
                </Pressable>
              ))}
            </View>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setAddModalVisible(false)}
                className="flex-1 py-3 rounded-lg bg-white/10 items-center"
              >
                <Text className="text-white">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleAdd}
                disabled={!usernameInput.trim() || addCollaborator.isPending}
                className="flex-1 py-3 rounded-lg bg-blue-600 items-center"
              >
                {addCollaborator.isPending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-medium">Add</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
