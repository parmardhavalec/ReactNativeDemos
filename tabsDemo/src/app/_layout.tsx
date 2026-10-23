import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="middle" options={{ title: 'Middle' }} />
      <Stack.Screen name="tabs" options={{ headerShown: false, title: 'Tabs' }} />
    </Stack>
  );
}
