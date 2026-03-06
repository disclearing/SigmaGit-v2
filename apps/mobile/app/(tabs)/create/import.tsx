import { View } from "react-native";
import { EmptyState } from "@/components/ui/empty-state";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export default function ImportRepoScreen() {
  return (
    <View className="flex-1 bg-black">
      <EmptyState
        icon={<FontAwesome name="download" size={48} color="rgba(255,255,255,0.3)" />}
        title="Import repository"
        description="Import from GitHub, GitLab, or URL will be available in the next update."
      />
    </View>
  );
}
