import { View, Text, ScrollView, RefreshControl } from "react-native";
import { Stack } from "expo-router";
import { useRunners } from "@sigmagit/hooks";

export default function AdminRunnersScreen() {
  const { data, refetch, isRefetching } = useRunners();
  const runners = data?.runners ?? [];

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ title: "Runners" }} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#60a5fa" />}
      >
        {runners.map((r) => (
          <View key={r.id} className="py-3 border-b border-gray-800">
            <Text className="text-white font-medium">{r.name ?? r.id}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
