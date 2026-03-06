import { View, Pressable, ActivityIndicator, Alert } from "react-native";
import { Stack } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser, useApi } from "@sigmagit/hooks";
import { UserAvatar } from "@/components/user-avatar";

export default function AvatarSettingsScreen() {
  const { data } = useCurrentUser();
  const user = data?.user;
  const api = useApi();
  const queryClient = useQueryClient();
  const updateAvatar = useMutation({
    mutationFn: ({ uri, mimeType }: { uri: string; mimeType: string }) => api.settings.updateAvatar(uri, mimeType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow access to photos to change your avatar.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      updateAvatar.mutate({ uri: result.assets[0].uri, mimeType: "image/jpeg" });
    }
  };

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ title: "Avatar" }} />
      <View className="p-4 items-center">
        <UserAvatar avatarUrl={user?.avatarUrl} size={120} style={{ marginBottom: 24 }} />
        <Pressable onPress={pickImage} disabled={updateAvatar.isPending} className="py-3 px-6 bg-blue-600 rounded-lg">
          {updateAvatar.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold">Change avatar</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
