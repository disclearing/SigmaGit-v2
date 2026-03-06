import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { Stack, router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useDeleteAccount } from "@sigmagit/hooks";
import { signOut } from "@/lib/auth-client";

export default function DangerSettingsScreen() {
  const deleteAccount = useDeleteAccount();

  const handleDelete = () => {
    Alert.alert(
      "Delete account",
      "Are you sure? This will permanently delete your account and all associated data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteAccount.mutate(undefined, {
              onSuccess: async () => {
                await signOut();
                router.replace("/(auth)/login");
              },
              onError: (e) => Alert.alert("Error", e.message),
            });
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ title: "Danger zone" }} />
      <ScrollView className="flex-1" contentContainerClassName="p-4">
        <View className="p-4 rounded-lg border border-red-500/50 bg-red-500/10 mb-4">
          <View className="flex-row items-center gap-2 mb-2">
            <FontAwesome name="exclamation-triangle" size={20} color="#f87171" />
            <Text className="text-red-400 font-semibold">Delete account</Text>
          </View>
          <Text className="text-gray-300 text-sm mb-4">
            Permanently delete your account and all repositories, gists, and data. This action cannot be undone.
          </Text>
          <Pressable onPress={handleDelete} disabled={deleteAccount.isPending} className="py-3 bg-red-600 rounded-lg items-center">
            {deleteAccount.isPending ? <ActivityIndicator color="white" /> : <Text className="text-white font-semibold">Delete my account</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
