import { Stack } from "expo-router";

export default function ListingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0B0B0F" },
      }}
    />
  );
}
