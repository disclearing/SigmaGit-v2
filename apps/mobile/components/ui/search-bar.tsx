import { View, TextInput, Pressable } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmitEditing?: () => void;
  autoFocus?: boolean;
  className?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Search...",
  onSubmitEditing,
  autoFocus,
  className = "",
}: SearchBarProps) {
  return (
    <View className={`flex-row items-center bg-white/5 border border-gray-700/50 rounded-lg ${className}`}>
      <View className="pl-4">
        <FontAwesome name="search" size={16} color="rgba(255,255,255,0.4)" />
      </View>
      <TextInput
        className="flex-1 py-3 px-3 text-base text-white"
        placeholder={placeholder}
        placeholderTextColor="rgba(255, 255, 255, 0.3)"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        autoFocus={autoFocus}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText("")} className="p-3">
          <FontAwesome name="times-circle" size={18} color="rgba(255,255,255,0.5)" />
        </Pressable>
      ) : null}
    </View>
  );
}
