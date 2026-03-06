import { View, Text } from "react-native";

type State = "open" | "closed" | "merged";

interface StateBadgeProps {
  state: State;
  className?: string;
}

const stateConfig: Record<State, { bg: string; text: string; label: string }> = {
  open: { bg: "bg-green-500/20", text: "text-green-400", label: "Open" },
  closed: { bg: "bg-gray-500/20", text: "text-gray-400", label: "Closed" },
  merged: { bg: "bg-purple-500/20", text: "text-purple-400", label: "Merged" },
};

export function StateBadge({ state, className = "" }: StateBadgeProps) {
  const config = stateConfig[state] ?? stateConfig.closed;
  return (
    <View className={`rounded-full border border-gray-600 px-2.5 py-0.5 ${config.bg} ${className}`}>
      <Text className={`text-xs font-medium ${config.text}`}>{config.label}</Text>
    </View>
  );
}
