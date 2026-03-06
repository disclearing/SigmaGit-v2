import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { useAdminOrganizations } from "@sigmagit/hooks";

export default function AdminOrganizationsScreen() {
  const { data, isLoading, refetch, isRefetching } = useAdminOrganizations("", 50, 0);
  const orgs = data?.organizations ?? [];

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ title: "Organizations" }} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#60a5fa" />}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#60a5fa" className="py-12" />
        ) : (
          orgs.map((o) => (
            <View key={o.id} className="py-3 border-b border-gray-800">
              <Text className="text-white font-medium">{o.name}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
