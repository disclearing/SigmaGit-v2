import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { useAdminUsers } from "@sigmagit/hooks";

export default function AdminUsersScreen() {
  const { data, isLoading, refetch, isRefetching } = useAdminUsers("", undefined, 50, 0);

  const users = data?.users ?? [];

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ title: "Users" }} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#60a5fa" />}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#60a5fa" className="py-12" />
        ) : (
          users.map((u) => (
            <View key={u.id} className="py-3 border-b border-gray-800">
              <Text className="text-white font-medium">@{u.username}</Text>
              <Text className="text-gray-400 text-sm">{u.email}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
