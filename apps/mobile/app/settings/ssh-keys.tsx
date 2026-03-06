import { View, Text, ScrollView, RefreshControl, Pressable, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useSshKeys } from "@sigmagit/hooks";
import { EmptyState } from "@/components/ui/empty-state";

export default function SshKeysSettingsScreen() {
  const { data: keysData, isLoading, refetch, isRefetching } = useSshKeys();
  const keys = keysData?.sshKeys ?? [];

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ title: "SSH keys" }} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#60a5fa" />}
      >
        {isLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#60a5fa" />
          </View>
        ) : keys.length === 0 ? (
          <EmptyState
            icon={<FontAwesome name="key" size={40} color="rgba(255,255,255,0.3)" />}
            title="No SSH keys"
            description="Add an SSH key to push and pull over SSH. Use the web app to add keys."
          />
        ) : (
          keys.map((key) => (
            <View key={key.id} className="py-3 border-b border-gray-800">
              <Text className="text-white font-medium">{key.title ?? "SSH key"}</Text>
              <Text className="text-gray-500 text-xs font-mono mt-1" numberOfLines={1}>
                {key.publicKeyPreview}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
