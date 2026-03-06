import { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { validatePassword } from "@sigmagit/lib";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    const validation = validatePassword(password);
    if (!validation.valid) {
      Alert.alert("Error", validation.error);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to reset password");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <View style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View className="flex-1 justify-center px-6">
            <View className="bg-gray-800/50 border border-gray-700/50 p-6">
              <View className="items-center">
                <View className="w-14 h-14 rounded-full bg-red-500/20 items-center justify-center mb-4">
                  <FontAwesome name="exclamation-circle" size={28} color="rgb(239 68 68)" />
                </View>
                <Text className="text-white text-xl font-semibold mb-2">Invalid reset link</Text>
                <Text className="text-gray-400 text-sm text-center mb-6">
                  This password reset link is invalid or has expired.
                </Text>
                <Link href="/(auth)/forgot-password" asChild>
                  <Pressable className="py-3 px-6 bg-blue-600">
                    <Text className="text-white font-semibold">Request a new link</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (success) {
    return (
      <View style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View className="flex-1 justify-center px-6">
            <View className="bg-gray-800/50 border border-gray-700/50 p-6">
              <View className="items-center">
                <View className="w-14 h-14 rounded-full bg-green-500/20 items-center justify-center mb-4">
                  <FontAwesome name="check-circle" size={28} color="rgb(34 197 94)" />
                </View>
                <Text className="text-white text-xl font-semibold mb-2">Password reset complete</Text>
                <Text className="text-gray-400 text-sm text-center mb-6">
                  You can now sign in with your new password.
                </Text>
                <Link href="/(auth)/login" asChild>
                  <Pressable className="py-3 px-6 bg-blue-600">
                    <Text className="text-white font-semibold">Sign in</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View className="flex-1 justify-center px-6">
            <View className="bg-gray-800/50 border border-gray-700/50 p-6">
              <View className="items-center">
                <View className="w-14 h-14 rounded-full bg-red-500/20 items-center justify-center mb-4">
                  <FontAwesome name="exclamation-circle" size={28} color="rgb(239 68 68)" />
                </View>
                <Text className="text-white text-xl font-semibold mb-2">Reset failed</Text>
                <Text className="text-gray-400 text-sm text-center mb-6">{error}</Text>
                <Link href="/(auth)/forgot-password" asChild>
                  <Pressable className="py-3 px-6 bg-blue-600">
                    <Text className="text-white font-semibold">Request a new link</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView contentContainerClassName="flex-1 justify-center px-6" keyboardShouldPersistTaps="handled">
            <View className="items-center mb-8">
              <View className="w-[72px] h-[72px] bg-gray-700 items-center justify-center mb-5">
                <FontAwesome name="lock" size={32} color="rgba(255,255,255,0.7)" />
              </View>
              <Text className="text-white text-2xl font-bold mb-2">Create new password</Text>
              <Text className="text-gray-400 text-base text-center">Enter your new password below.</Text>
            </View>

            <View className="bg-gray-800/50 border border-gray-700/50 overflow-hidden">
              <View className="p-6">
                <View className="mb-5">
                  <Text className="text-gray-200 text-sm font-semibold mb-2">New password</Text>
                  <View className="flex-row items-center bg-white/5 border border-gray-700/50">
                    <View className="pl-4">
                      <FontAwesome name="lock" size={18} color="rgba(255,255,255,0.4)" />
                    </View>
                    <TextInput
                      style={{ flex: 1 }}
                      className="py-3.5 px-3 text-base text-white"
                      placeholder="••••••••"
                      placeholderTextColor="rgba(255, 255, 255, 0.3)"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoComplete="new-password"
                    />
                    <Pressable onPress={() => setShowPassword(!showPassword)} className="p-3.5">
                      <FontAwesome name={showPassword ? "eye-slash" : "eye"} size={18} color="rgba(255, 255, 255, 0.4)" />
                    </Pressable>
                  </View>
                  <Text className="text-gray-500 text-xs mt-2">At least 8 characters</Text>
                </View>

                <View className="mb-5">
                  <Text className="text-gray-200 text-sm font-semibold mb-2">Confirm password</Text>
                  <View className="flex-row items-center bg-white/5 border border-gray-700/50">
                    <View className="pl-4">
                      <FontAwesome name="lock" size={18} color="rgba(255,255,255,0.4)" />
                    </View>
                    <TextInput
                      style={{ flex: 1 }}
                      className="py-3.5 px-3 text-base text-white"
                      placeholder="••••••••"
                      placeholderTextColor="rgba(255, 255, 255, 0.3)"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showPassword}
                      autoComplete="new-password"
                    />
                  </View>
                </View>

                <Pressable onPress={handleSubmit} disabled={loading}>
                  <View className={`py-4 items-center mt-2 bg-blue-600 border border-blue-500 ${loading ? "opacity-60" : ""}`}>
                    <Text className="text-white text-base font-semibold">
                      {loading ? "Resetting..." : "Reset password"}
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>

            <View className="flex-row justify-center mt-8">
              <Link href="/(auth)/login" asChild>
                <Pressable>
                  <Text className="text-gray-400 text-base">Back to sign in</Text>
                </Pressable>
              </Link>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
