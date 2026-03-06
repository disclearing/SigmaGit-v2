import { Stack } from "expo-router";

export default function CreateLayout() {
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerTransparent: true,
      }}
    />
  );
}
