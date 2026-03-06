import { View, Text } from "react-native";
import { EmptyState } from "@/components/ui/empty-state";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export default function NewRepoScreen() {
  return (
    <View className="flex-1 bg-black">
      <EmptyState
        icon={<FontAwesome name="code-fork" size={48} color="rgba(255,255,255,0.3)" />}
        title="New repository"
        description="Create repository form will be available in the next update."
      />
    </View>
  );
}
