import { useState } from "react";
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { Stack } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useCurrentUser, useUpdateEmail, useUpdatePassword } from "@sigmagit/hooks";
import { validatePassword } from "@sigmagit/lib";

export default function AccountSettingsScreen() {
  const { data } = useCurrentUser();
  const user = data?.user;
  const updateEmail = useUpdateEmail();
  const updatePassword = useUpdatePassword();

  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSaveEmail = () => {
    if (!email.trim()) return;
    updateEmail.mutate({ email: email.trim() });
  };

  const handleSavePassword = () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    const v = validatePassword(password);
    if (!v.valid) {
      Alert.alert("Error", v.error);
      return;
    }
    updatePassword.mutate({ password });
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-black">
      <Stack.Screen options={{ title: "Account" }} />
      <ScrollView className="flex-1" contentContainerClassName="p-4" keyboardShouldPersistTaps="handled">
        <View className="mb-6">
          <Text className="text-gray-400 text-sm font-semibold mb-2">Email</Text>
          <TextInput
            className="bg-white/5 border border-gray-700 rounded-lg px-3 py-3 text-white text-base"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="rgba(255,255,255,0.3)"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Pressable onPress={handleSaveEmail} disabled={updateEmail.isPending} className="mt-2 py-2 bg-blue-600 rounded-lg items-center">
            {updateEmail.isPending ? <ActivityIndicator color="white" /> : <Text className="text-white font-medium">Update email</Text>}
          </Pressable>
        </View>

        <View className="mb-4">
          <Text className="text-gray-400 text-sm font-semibold mb-2">New password</Text>
          <TextInput
            className="bg-white/5 border border-gray-700 rounded-lg px-3 py-3 text-white text-base mb-2"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="rgba(255,255,255,0.3)"
            secureTextEntry
          />
          <Text className="text-gray-400 text-sm font-semibold mb-2">Confirm password</Text>
          <TextInput
            className="bg-white/5 border border-gray-700 rounded-lg px-3 py-3 text-white text-base mb-2"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="••••••••"
            placeholderTextColor="rgba(255,255,255,0.3)"
            secureTextEntry
          />
          <Pressable onPress={handleSavePassword} disabled={!password || !confirmPassword || updatePassword.isPending} className="py-2 bg-blue-600 rounded-lg items-center">
            {updatePassword.isPending ? <ActivityIndicator color="white" /> : <Text className="text-white font-medium">Update password</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
