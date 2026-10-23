import { router, Tabs } from 'expo-router';
import { Button } from 'react-native';

function handleLogout() {
  // Pop the stack back to the existing Home route instead of pushing
  // a new Home on top. router.replace() from inside the nested Tabs
  // navigator only replaces the inner tab route, leaving
  // [home, middle, tabs, home] underneath — hence the back button.
  try {
    router.dismissTo('/');
  } catch {
    // Fallback if Home isn't in history (e.g. deep link straight to tabs):
    // clear to the first screen, then go Home with a clean stack.
    router.dismissAll();
    router.replace('/');
  }
}

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="feeds"
      screenOptions={{
        headerRight: () => <Button title="Logout" onPress={handleLogout} />,
      }}>
      <Tabs.Screen name="feeds" options={{ title: 'Feeds' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
