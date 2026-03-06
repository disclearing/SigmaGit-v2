import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export function NostrAuthButton() {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push("/(auth)/nostr-login")}
      className="flex-row items-center justify-center gap-2 py-4 border border-amber-500/50 bg-amber-500/10"
    >
      <FontAwesome name="bolt" size={18} color="rgb(245 158 11)" />
      <Text className="text-amber-400 text-base font-semibold">Sign in with Nostr</Text>
    </Pressable>
  );
}
