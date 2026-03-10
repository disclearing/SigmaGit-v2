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
  useBranchProtectionRules,
  useCreateBranchProtectionRule,
  useUpdateBranchProtectionRule,
  useDeleteBranchProtectionRule,
} from "@sigmagit/hooks";
import type { BranchProtectionRule } from "@sigmagit/hooks";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { EmptyState } from "@/components/ui/empty-state";

export default function BranchProtectionScreen() {
  const { username, repo: repoName } = useLocalSearchParams<{ username: string; repo: string }>();
  const { data, isLoading, refetch, isRefetching } = useBranchProtectionRules(username || "", repoName || "");
  const createRule = useCreateBranchProtectionRule(username || "", repoName || "");
  const deleteRule = useDeleteBranchProtectionRule(username || "", repoName || "");

  const [modalVisible, setModalVisible] = useState(false);
  const [pattern, setPattern] = useState("");
  const [requirePR, setRequirePR] = useState(false);
  const [requireApprovals, setRequireApprovals] = useState(0);

  const rules = data?.rules ?? [];

  const handleCreate = () => {
    if (!pattern.trim()) return;
    createRule.mutate(
      {
        pattern: pattern.trim(),
        requirePullRequest: requirePR,
        requireApprovals: requirePR ? requireApprovals : 0,
      },
      {
        onSuccess: () => {
          setModalVisible(false);
          setPattern("");
          setRequirePR(false);
          setRequireApprovals(0);
          refetch();
        },
        onError: (e) => Alert.alert("Error", e.message),
      }
    );
  };

  const handleDelete = (rule: BranchProtectionRule) => {
    Alert.alert("Delete rule", `Remove protection for "${rule.pattern}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          deleteRule.mutate(rule.id, {
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
          title: "Branch protection",
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
        ) : rules.length === 0 ? (
          <EmptyState
            icon={<FontAwesome name="lock" size={40} color="rgba(255,255,255,0.3)" />}
            title="No branch protection rules"
            description="Add a rule to require pull requests or status checks for branches like main."
          />
        ) : (
          rules.map((rule) => (
            <View
              key={rule.id}
              className="flex-row items-center justify-between py-4 border-b border-gray-800"
            >
              <View className="flex-1">
                <Text className="text-white font-mono font-medium">{rule.pattern}</Text>
                <Text className="text-gray-400 text-xs mt-1">
                  {rule.requirePullRequest && `PR required (${rule.requireApprovals} approval(s))`}
                  {!rule.requirePullRequest && "No extra restrictions"}
                </Text>
              </View>
              <Pressable onPress={() => handleDelete(rule)} className="p-2">
                <FontAwesome name="trash-o" size={18} color="#f87171" />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/70">
          <View className="bg-gray-900 rounded-t-2xl p-6">
            <Text className="text-white text-lg font-semibold mb-4">Add branch protection rule</Text>
            <Text className="text-gray-400 text-sm mb-2">Branch name pattern (e.g. main)</Text>
            <TextInput
              value={pattern}
              onChangeText={setPattern}
              placeholder="main"
              placeholderTextColor="#9ca3af"
              className="bg-white/5 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono mb-4"
            />
            <Pressable
              onPress={() => setRequirePR(!requirePR)}
              className="flex-row items-center mb-2"
            >
              <View className={`w-5 h-5 rounded border-2 mr-2 ${requirePR ? "bg-blue-600 border-blue-600" : "border-gray-600"}`}>
                {requirePR && <FontAwesome name="check" size={12} color="white" style={{ margin: 2 }} />}
              </View>
              <Text className="text-white">Require pull request before merging</Text>
            </Pressable>
            {requirePR && (
              <View className="ml-7 mb-4">
                <Text className="text-gray-400 text-sm mb-1">Required approvals</Text>
                <TextInput
                  value={String(requireApprovals)}
                  onChangeText={(t) => setRequireApprovals(parseInt(t, 10) || 0)}
                  keyboardType="number-pad"
                  className="bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white w-20"
                />
              </View>
            )}
            <View className="flex-row gap-3 mt-4">
              <Pressable
                onPress={() => setModalVisible(false)}
                className="flex-1 py-3 rounded-lg bg-white/10 items-center"
              >
                <Text className="text-white">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreate}
                disabled={!pattern.trim() || createRule.isPending}
                className="flex-1 py-3 rounded-lg bg-blue-600 items-center"
              >
                {createRule.isPending ? (
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
