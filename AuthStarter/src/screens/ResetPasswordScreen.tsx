
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import AuthInput from '../components/AuthInput';
import PrimaryButton from '../components/PrimaryButton';

type Props = {
  loading: boolean;
  message: string;
  messageIsError: boolean;
  onSubmit: (password: string, confirmPassword: string) => void;
  onBack: () => void;
};

export default function ResetPasswordScreen(props: Props) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose a new password</Text>
      <Text style={styles.subtitle}>
        Enter your new password below.
      </Text>

      <AuthInput
        placeholder="New password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
      />

      <AuthInput
        placeholder="Confirm new password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        autoComplete="new-password"
      />

      {props.message !== '' && (
        <Text
          style={[
            styles.message,
            props.messageIsError ? styles.error : styles.success,
          ]}
        >
          {props.message}
        </Text>
      )}

      <PrimaryButton
        title="Update Password"
        loading={props.loading}
        onPress={() => props.onSubmit(password, confirmPassword)}
      />

      <Pressable onPress={props.onBack}>
        <Text style={styles.link}>Back to sign in</Text>
      </Pressable>
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
    marginBottom: 24,
  },
  message: { marginBottom: 14, lineHeight: 21 },
  error: { color: '#c62828' },
  success: { color: '#18794e' },
  link: {
    color: '#315ee7',
    textAlign: 'center',
    marginTop: 16,
  },
});
