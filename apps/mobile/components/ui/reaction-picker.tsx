import { View, Text, Pressable } from "react-native";

const EMOJI_LIST = ["👍", "👎", "❤️", "🎉", "😄", "🚀", "👀"];

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  className?: string;
}

export function ReactionPicker({ onSelect, className = "" }: ReactionPickerProps) {
  return (
    <View className={`flex-row flex-wrap gap-2 ${className}`}>
      {EMOJI_LIST.map((emoji) => (
        <Pressable
          key={emoji}
          onPress={() => onSelect(emoji)}
          className="py-2 px-3 rounded-lg bg-white/5 border border-gray-700 active:bg-white/10"
        >
          <Text className="text-lg">{emoji}</Text>
        </Pressable>
      ))}
    </View>
  );
}

interface ReactionChipProps {
  emoji: string;
  count: number;
  active?: boolean;
  onPress?: () => void;
  className?: string;
}

export function ReactionChip({ emoji, count, active, onPress, className = "" }: ReactionChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-1.5 rounded-full border px-2.5 py-1 ${
        active ? "bg-amber-500/20 border-amber-500/50" : "bg-white/5 border-gray-700"
      } ${className}`}
    >
      <Text className="text-sm">{emoji}</Text>
      <Text className="text-xs text-gray-300">{count}</Text>
    </Pressable>
  );
}
