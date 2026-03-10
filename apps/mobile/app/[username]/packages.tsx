import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useUserPackages } from "@sigmagit/hooks";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { EmptyState } from "@/components/ui/empty-state";

export default function PackagesScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { data, isLoading, refetch, isRefetching } = useUserPackages(username || "");

  const packages = data?.packages ?? [];

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ title: "Packages" }} />
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
        ) : packages.length === 0 ? (
          <EmptyState
            icon={<FontAwesome name="cube" size={40} color="rgba(255,255,255,0.3)" />}
            title="No container images"
            description="Push images with docker push to get started."
          />
        ) : (
          packages.map((pkg) => (
            <View
              key={`${pkg.owner}/${pkg.name}`}
              className="py-4 border-b border-gray-800"
            >
              <Text className="text-white font-mono font-medium">{pkg.owner}/{pkg.name}</Text>
              <Text className="text-gray-400 text-xs mt-1">{pkg.tags.length} tag(s)</Text>
              <Text className="text-gray-500 text-xs mt-1" numberOfLines={1}>
                docker pull &lt;host&gt;/{pkg.owner}/{pkg.name}:&lt;tag&gt;
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
