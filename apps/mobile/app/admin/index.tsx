import { View, Text, ScrollView, RefreshControl, Pressable } from "react-native";
import { Stack, router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useAdminStats } from "@sigmagit/hooks";

const adminLinks = [
  { label: "Users", icon: "users", route: "/admin/users" },
  { label: "Repositories", icon: "code-fork", route: "/admin/repositories" },
  { label: "Organizations", icon: "building", route: "/admin/organizations" },
  { label: "Reports", icon: "flag", route: "/admin/reports" },
  { label: "Audit logs", icon: "list-alt", route: "/admin/audit-logs" },
  { label: "Runners", icon: "play", route: "/admin/runners" },
  { label: "Settings", icon: "cog", route: "/admin/settings" },
];

export default function AdminDashboardScreen() {
  const { data: stats, refetch, isRefetching } = useAdminStats();

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ title: "Admin" }} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#60a5fa" />}
      >
        {stats && (
          <View className="flex-row flex-wrap gap-2 mb-6">
            <View className="p-4 rounded-lg bg-white/5 border border-gray-800 min-w-[100px]">
              <Text className="text-gray-400 text-xs">Users</Text>
              <Text className="text-white text-xl font-semibold">{stats.users ?? 0}</Text>
            </View>
            <View className="p-4 rounded-lg bg-white/5 border border-gray-800 min-w-[100px]">
              <Text className="text-gray-400 text-xs">Repos</Text>
              <Text className="text-white text-xl font-semibold">{stats.repositories ?? 0}</Text>
            </View>
          </View>
        )}
        {adminLinks.map((link) => (
          <Pressable key={link.route} onPress={() => router.push(link.route as any)} className="flex-row items-center py-4 border-b border-gray-800 active:bg-white/5">
            <View className="w-10 h-10 rounded-lg bg-white/10 items-center justify-center mr-4">
              <FontAwesome name={link.icon as any} size={18} color="rgba(255,255,255,0.8)" />
            </View>
            <Text className="text-white font-medium flex-1">{link.label}</Text>
            <FontAwesome name="chevron-right" size={14} color="rgba(255,255,255,0.4)" />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
