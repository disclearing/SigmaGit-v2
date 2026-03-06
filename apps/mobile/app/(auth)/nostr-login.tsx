import { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { signInWithNostr } from "@/lib/auth-client";
import { openSignerAppForPublicKey, normalizeNpubInput, isValidNpubOrHex } from "@/lib/nostr-signer";

export default function NostrLoginScreen() {
  const router = useRouter();
  const [npubInput, setNpubInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [signerOpening, setSignerOpening] = useState(false);

  const handleManualSubmit = async () => {
    const normalized = normalizeNpubInput(npubInput);
    if (!normalized) {
      Alert.alert("Missing key", "Paste your npub (e.g. npub1...) or hex public key.");
      return;
    }
    if (!isValidNpubOrHex(normalized)) {
      Alert.alert("Invalid key", "Enter a valid npub (starts with npub1) or 64-character hex public key.");
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithNostr(normalized);
      if (result.success) {
        router.replace("/(tabs)");
      } else {
        Alert.alert("Sign in failed", result.error ?? "Unknown error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSignerApp = async () => {
    setSignerOpening(true);
    try {
      const opened = await openSignerAppForPublicKey();
      if (!opened && Platform.OS === "android") {
        Alert.alert(
          "No signer app",
          "Install a Nostr signer like Amber to use this option, or paste your npub above."
        );
      } else if (!opened) {
        Alert.alert(
          "Signer app",
          "On iOS you can paste your npub or hex public key in the field above. Signer app deep links may be supported in the future."
        );
      }
    } finally {
      setSignerOpening(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView contentContainerClassName="flex-1 justify-center px-6" keyboardShouldPersistTaps="handled">
            <View className="items-center mb-8">
              <View className="w-[72px] h-[72px] bg-amber-500/20 items-center justify-center mb-5 border border-amber-500/50">
                <FontAwesome name="bolt" size={36} color="rgb(245 158 11)" />
              </View>
              <Text className="text-white text-3xl font-bold mb-2">Nostr sign-in</Text>
              <Text className="text-gray-400 text-base text-center">
                Paste your public key (npub or hex) or open your signer app
              </Text>
            </View>

            <View className="bg-gray-800/50 border border-gray-700/50 overflow-hidden">
              <View className="p-6">
                <View className="mb-5">
                  <Text className="text-gray-200 text-sm font-semibold mb-2">Public key (npub or hex)</Text>
                  <TextInput
                    className="bg-white/5 border border-gray-700/50 py-3.5 px-4 text-base text-white"
                    placeholder="npub1... or 64-character hex"
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    value={npubInput}
                    onChangeText={setNpubInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                <Pressable onPress={handleManualSubmit} disabled={loading}>
                  <View className={`py-4 items-center mt-2 bg-amber-600 border border-amber-500 ${loading ? "opacity-60" : ""}`}>
                    <Text className="text-white text-base font-semibold">
                      {loading ? "Signing in..." : "Sign in with key"}
                    </Text>
                  </View>
                </Pressable>

                <View className="mt-4 pt-4 border-t border-gray-700/50">
                  <Text className="text-gray-400 text-sm text-center mb-3">Or use a signer app (e.g. Amber on Android)</Text>
                  <Pressable onPress={handleOpenSignerApp} disabled={signerOpening}>
                    <View className="py-3 items-center border border-amber-500/50 bg-amber-500/10">
                      <Text className="text-amber-400 text-base font-medium">
                        {signerOpening ? "Opening..." : "Open signer app"}
                      </Text>
                    </View>
                  </Pressable>
                </View>
              </View>
            </View>

            <View className="flex-row justify-center mt-8">
              <Pressable onPress={() => router.back()}>
                <Text className="text-gray-400 text-base">Back to login</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
