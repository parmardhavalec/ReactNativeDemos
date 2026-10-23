import { router } from 'expo-router';
import { Button, StyleSheet, Text, View } from 'react-native';

export default function MiddleScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Middle</Text>
      <Button title="Tabs" onPress={() => router.push('/tabs/feeds')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
});
