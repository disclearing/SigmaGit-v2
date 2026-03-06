import { Stack } from "expo-router";

export default function RepoLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackButtonDisplayMode: "minimal",
        headerTransparent: true,
        headerLargeTitle: false,
      }}
    />
  );
}
