import { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { Stack } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useCurrentUser, useUpdateProfile } from "@sigmagit/hooks";

export default function ProfileSettingsScreen() {
  const { data } = useCurrentUser();
  const user = data?.user;
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState(user?.name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setBio(user.bio ?? "");
    }
  }, [user]);

  const handleSave = () => {
    updateProfile.mutate({ name: name.trim() || undefined, bio: bio.trim() || undefined });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-black">
      <Stack.Screen options={{ title: "Profile" }} />
      <ScrollView className="flex-1" contentContainerClassName="p-4" keyboardShouldPersistTaps="handled">
        <View className="mb-4">
          <Text className="text-gray-400 text-sm font-semibold mb-2">Name</Text>
          <TextInput
            className="bg-white/5 border border-gray-700 rounded-lg px-3 py-3 text-white text-base"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor="rgba(255,255,255,0.3)"
          />
        </View>
        <View className="mb-4">
          <Text className="text-gray-400 text-sm font-semibold mb-2">Username</Text>
          <Text className="text-white text-base py-2">@{user?.username ?? ""}</Text>
          <Text className="text-gray-500 text-xs">Username cannot be changed here.</Text>
        </View>
        <View className="mb-4">
          <Text className="text-gray-400 text-sm font-semibold mb-2">Bio</Text>
          <TextInput
            className="bg-white/5 border border-gray-700 rounded-lg px-3 py-3 text-white text-base min-h-[80px]"
            value={bio}
            onChangeText={setBio}
            placeholder="Short bio"
            placeholderTextColor="rgba(255,255,255,0.3)"
            multiline
          />
        </View>
        <Pressable onPress={handleSave} disabled={updateProfile.isPending} className="py-3 bg-blue-600 rounded-lg items-center">
          {updateProfile.isPending ? <ActivityIndicator color="white" /> : <Text className="text-white font-semibold">Save</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
