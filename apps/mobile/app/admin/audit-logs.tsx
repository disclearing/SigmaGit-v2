import { View, Text, ScrollView } from "react-native";
import { Stack } from "expo-router";

export default function AdminAuditLogsScreen() {
  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ title: "Audit logs" }} />
      <ScrollView className="flex-1" contentContainerClassName="p-4">
        <Text className="text-gray-400">Audit logs</Text>
      </ScrollView>
    </View>
  );
}
