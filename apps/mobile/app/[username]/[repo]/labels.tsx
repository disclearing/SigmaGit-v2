import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useLabels } from "@sigmagit/hooks";
import { LabelBadge } from "@/components/ui/label-badge";
import { EmptyState } from "@/components/ui/empty-state";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export default function LabelsScreen() {
  const { username, repo: repoName } = useLocalSearchParams<{ username: string; repo: string }>();

  const { data: labelsData, isLoading, refetch, isRefetching } = useLabels(username || "", repoName || "");
  const labels = labelsData?.labels ?? [];

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ title: "Labels" }} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#60a5fa" />}
      >
        {isLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#60a5fa" />
          </View>
        ) : labels.length === 0 ? (
          <EmptyState
            icon={<FontAwesome name="tags" size={40} color="rgba(255,255,255,0.3)" />}
            title="No labels"
            description="Create labels to categorize issues and pull requests."
          />
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {labels.map((l) => (
              <LabelBadge key={l.id} name={l.name} color={l.color} className="mb-2" />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
