import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { Stack } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

export default function NostrSettingsScreen() {
  const [loading, setLoading] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [status, setStatus] = useState<{ linked: boolean; nostrPublicKey: string | null }>({ linked: false, nostrPublicKey: null });

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/nostr/status`, {
        headers: await getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setStatus({ linked: !!data.linked, nostrPublicKey: data.nostrPublicKey ?? null });
      }
    } catch {}
  };

  const getAuthHeaders = async (): Promise<HeadersInit> => {
    const { getSession } = await import("@/lib/auth-client");
    const session = await getSession();
    if (session?.data?.session?.token) {
      return { Authorization: `Bearer ${session.data.session.token}` };
    }
    return {};
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleUnlink = async () => {
    setUnlinking(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/nostr/link`, {
        method: "DELETE",
        headers: await getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to unlink");
      setStatus({ linked: false, nostrPublicKey: null });
      Alert.alert("Success", "Nostr identity unlinked.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to unlink");
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ title: "Nostr" }} />
      <ScrollView className="flex-1" contentContainerClassName="p-4">
        {status.linked ? (
          <>
            <View className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 mb-4">
              <View className="flex-row items-center gap-2 mb-2">
                <FontAwesome name="check-circle" size={20} color="#22c55e" />
                <Text className="text-green-400 font-semibold">Nostr identity linked</Text>
              </View>
              <Text className="text-gray-300 text-sm font-mono" numberOfLines={2}>
                {status.nostrPublicKey ?? ""}
              </Text>
            </View>
            <Pressable onPress={handleUnlink} disabled={unlinking} className="py-3 border border-red-500/50 rounded-lg items-center">
              {unlinking ? <ActivityIndicator color="#f87171" /> : <Text className="text-red-400 font-medium">Unlink Nostr</Text>}
            </Pressable>
          </>
        ) : (
          <View className="p-4 rounded-lg bg-white/5 border border-gray-800">
            <Text className="text-gray-300 text-sm">Link your Nostr identity in the Nostr login flow or from the web app. On mobile you can sign in with Nostr by pasting your npub on the login screen.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
