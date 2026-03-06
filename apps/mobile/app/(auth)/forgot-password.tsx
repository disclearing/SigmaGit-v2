import { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      Alert.alert("Error", "Enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        Alert.alert("Error", data.error ?? "Failed to send reset email");
        return;
      }
      setSent(true);
    } catch {
      Alert.alert("Error", "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View className="flex-1 justify-center px-6">
            <View className="bg-gray-800/50 border border-gray-700/50 p-6">
              <View className="items-center mb-4">
                <View className="w-14 h-14 rounded-full bg-green-500/20 items-center justify-center mb-4">
                  <FontAwesome name="check-circle" size={28} color="rgb(34 197 94)" />
                </View>
                <Text className="text-white text-xl font-semibold mb-2">Check your email</Text>
                <Text className="text-gray-400 text-sm text-center">
                  If an account exists for {email}, we've sent a password reset link.
                </Text>
              </View>
              <Pressable onPress={() => setSent(false)}>
                <Text className="text-amber-400 text-sm text-center">Try again</Text>
              </Pressable>
            </View>
            <View className="mt-6 flex-row justify-center">
              <Link href="/(auth)/login" asChild>
                <Pressable>
                  <Text className="text-gray-400">Back to sign in</Text>
                </Pressable>
              </Link>
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
                <FontAwesome name="envelope" size={32} color="rgba(255,255,255,0.7)" />
              </View>
              <Text className="text-white text-2xl font-bold mb-2">Reset your password</Text>
              <Text className="text-gray-400 text-base text-center">
                Enter your email and we'll send you a reset link.
              </Text>
            </View>

            <View className="bg-gray-800/50 border border-gray-700/50 overflow-hidden">
              <View className="p-6">
                <View className="mb-5">
                  <Text className="text-gray-200 text-sm font-semibold mb-2">Email</Text>
                  <View className="flex-row items-center bg-white/5 border border-gray-700/50">
                    <View className="pl-4">
                      <FontAwesome name="envelope" size={16} color="rgba(255,255,255,0.4)" />
                    </View>
                    <TextInput
                      style={{ flex: 1 }}
                      className="py-3.5 px-3 text-base text-white"
                      placeholder="you@example.com"
                      placeholderTextColor="rgba(255, 255, 255, 0.3)"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="email"
                    />
                  </View>
                </View>

                <Pressable onPress={handleSubmit} disabled={loading}>
                  <View className={`py-4 items-center mt-2 bg-blue-600 border border-blue-500 ${loading ? "opacity-60" : ""}`}>
                    <Text className="text-white text-base font-semibold">
                      {loading ? "Sending..." : "Send reset link"}
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
