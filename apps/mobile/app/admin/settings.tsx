import { View, Text, ScrollView } from "react-native";
import { Stack } from "expo-router";

export default function AdminSettingsScreen() {
  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ title: "System settings" }} />
      <ScrollView className="flex-1" contentContainerClassName="p-4">
        <Text className="text-gray-400">System configuration</Text>
      </ScrollView>
    </View>
  );
}
