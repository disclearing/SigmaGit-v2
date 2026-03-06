import { View, Text, ScrollView, RefreshControl, Pressable, ActivityIndicator } from "react-native";
import { Stack, router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useSession } from "@/lib/auth-client";
import { useMyGists, usePublicGists } from "@sigmagit/hooks";
import { timeAgo } from "@sigmagit/lib";
import { EmptyState } from "@/components/ui/empty-state";

export default function GistsListScreen() {
  const { data: session } = useSession();
  const { data: myGistsData, isLoading: myLoading, refetch: refetchMine, isRefetching: myRefetching } = useMyGists({ enabled: !!session?.user });
  const { data: publicData, isLoading: publicLoading, refetch: refetchPublic, isRefetching: publicRefetching } = usePublicGists(20, 0);

  const myGists = myGistsData?.gists ?? [];
  const publicGists = publicData?.gists ?? [];
  const gists = session?.user ? myGists : publicGists;
  const isLoading = session?.user ? myLoading : publicLoading;
  const refetch = session?.user ? refetchMine : refetchPublic;
  const isRefetching = session?.user ? myRefetching : publicRefetching;

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ title: "Gists" }} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#60a5fa" />}
      >
        {isLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#60a5fa" />
          </View>
        ) : gists.length === 0 ? (
          <EmptyState
            icon={<FontAwesome name="file-code-o" size={40} color="rgba(255,255,255,0.3)" />}
            title="No gists yet"
            description="Create a gist to share code snippets."
            action={
              session?.user ? (
                <Pressable onPress={() => router.push("/(tabs)/create/gist")} className="mt-2 px-4 py-2 bg-blue-600 rounded-lg">
                  <Text className="text-white font-medium">New gist</Text>
                </Pressable>
              ) : undefined
            }
          />
        ) : (
          gists.map((g) => (
            <Pressable key={g.id} onPress={() => router.push(`/(tabs)/gists/${g.id}`)} className="py-3 border-b border-gray-800 active:bg-white/5">
              <Text className="text-white font-medium" numberOfLines={1}>{g.description || "Untitled gist"}</Text>
              <Text className="text-gray-400 text-xs mt-1">{g.owner?.username ?? "Unknown"} · {timeAgo(g.createdAt)}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}
