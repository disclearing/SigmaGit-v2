import { View, Text, ScrollView } from "react-native";
import { Stack } from "expo-router";

export default function AdminReportsScreen() {
  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ title: "Reports" }} />
      <ScrollView className="flex-1" contentContainerClassName="p-4">
        <Text className="text-gray-400">Reports list</Text>
      </ScrollView>
    </View>
  );
}
