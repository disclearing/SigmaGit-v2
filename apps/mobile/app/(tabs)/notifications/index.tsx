import { View } from "react-native";
import { useSession } from "@/lib/auth-client";
import { EmptyState } from "@/components/ui/empty-state";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export default function NotificationsScreen() {
  const { data: session } = useSession();

  if (!session?.user) {
    return (
      <View className="flex-1 bg-black">
        <EmptyState
          icon={<FontAwesome name="bell" size={48} color="rgba(255,255,255,0.3)" />}
          title="Sign in to see notifications"
          description="Notifications for your issues, PRs, and mentions will appear here."
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black pt-4">
      <EmptyState
        icon={<FontAwesome name="bell-o" size={48} color="rgba(255,255,255,0.3)" />}
        title="No notifications yet"
        description="When someone mentions you or updates your issues and PRs, they'll show up here."
      />
    </View>
  );
}
