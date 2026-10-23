
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';

type Props = {
  email: string;
  loading: boolean;
  onLogout: () => void;
};

export default function HomeScreen({
  email,
  loading,
  onLogout,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>You're signed in!</Text>
      <Text style={styles.subtitle}>
        Welcome to AuthStarter.
      </Text>
      <Text style={styles.email}>{email}</Text>

      <PrimaryButton
        title="Sign Out"
        loading={loading}
        onPress={onLogout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f6f8fc',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#172033',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#667085',
    marginBottom: 12,
  },
  email: {
    fontSize: 15,
    color: '#667085',
    marginBottom: 24,
  },
});
