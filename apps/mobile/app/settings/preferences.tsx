import { View, Text, ScrollView } from "react-native";
import { Stack } from "expo-router";

export default function PreferencesSettingsScreen() {
  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ title: "Preferences" }} />
      <ScrollView className="flex-1" contentContainerClassName="p-4">
        <Text className="text-gray-400 text-sm">Theme, notifications, and other preferences can be configured on the web app.</Text>
      </ScrollView>
    </View>
  );
}
