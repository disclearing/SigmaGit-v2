import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSession } from "@/lib/auth-client";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { EmptyState } from "@/components/ui/empty-state";

export default function CreateScreen() {
  const router = useRouter();
  const { data: session } = useSession();

  if (!session?.user) {
    return (
      <View className="flex-1 bg-black">
        <EmptyState
          icon={<FontAwesome name="plus-circle" size={48} color="rgba(255,255,255,0.3)" />}
          title="Sign in to create"
          description="Create repositories, gists, and organizations after signing in."
        />
      </View>
    );
  }

  const options = [
    { label: "New repository", icon: "code-fork", route: "/(tabs)/create/repo" as const },
    { label: "New gist", icon: "file-code-o", route: "/(tabs)/create/gist" as const },
    { label: "New organization", icon: "users", route: "/(tabs)/create/org" as const },
    { label: "Import repository", icon: "download", route: "/(tabs)/create/import" as const },
  ];

  return (
    <View className="flex-1 bg-black pt-4 px-4">
      <Text className="text-gray-400 text-sm mb-4">Create new</Text>
      {options.map((opt) => (
        <Pressable
          key={opt.route}
          onPress={() => router.push(opt.route as any)}
          className="flex-row items-center gap-4 py-4 border-b border-gray-800 active:bg-white/5"
        >
          <View className="w-10 h-10 rounded-lg bg-white/10 items-center justify-center">
            <FontAwesome name={opt.icon as any} size={20} color="rgba(255,255,255,0.8)" />
          </View>
          <Text className="text-white text-base font-medium">{opt.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
