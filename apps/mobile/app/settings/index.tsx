import { View, Text, ScrollView, Pressable } from "react-native";
import { Stack, router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";

const rows = [
  { label: "Profile", icon: "user", route: "/settings/profile" },
  { label: "Avatar", icon: "picture-o", route: "/settings/avatar" },
  { label: "Account", icon: "envelope", route: "/settings/account" },
  { label: "Nostr", icon: "bolt", route: "/settings/nostr" },
  { label: "SSH keys", icon: "key", route: "/settings/ssh-keys" },
  { label: "Preferences", icon: "cog", route: "/settings/preferences" },
  { label: "Danger zone", icon: "exclamation-triangle", route: "/settings/danger", destructive: true },
];

export default function SettingsIndexScreen() {
  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ title: "Settings" }} />
      <ScrollView className="flex-1" contentContainerClassName="px-4 py-4">
        {rows.map((r) => (
          <Pressable
            key={r.route}
            onPress={() => router.push(r.route as any)}
            className="flex-row items-center py-4 border-b border-gray-800 active:bg-white/5"
          >
            <View className="w-10 h-10 rounded-lg bg-white/10 items-center justify-center mr-4">
              <FontAwesome name={r.icon as any} size={18} color={r.destructive ? "#f87171" : "rgba(255,255,255,0.8)"} />
            </View>
            <Text className={`flex-1 text-base font-medium ${r.destructive ? "text-red-400" : "text-white"}`}>
              {r.label}
            </Text>
            <FontAwesome name="chevron-right" size={14} color="rgba(255,255,255,0.4)" />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
