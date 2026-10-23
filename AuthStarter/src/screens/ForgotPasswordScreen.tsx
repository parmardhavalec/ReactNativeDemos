
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import AuthInput from '../components/AuthInput';
import PrimaryButton from '../components/PrimaryButton';

type Props = {
  loading: boolean;
  message: string;
  messageIsError: boolean;
  onSubmit: (email: string) => void;
  onBack: () => void;
};

export default function ForgotPasswordScreen(props: Props) {
  const [email, setEmail] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset your password</Text>
      <Text style={styles.subtitle}>
        Enter your email and we'll send you a reset link.
      </Text>

      <AuthInput
        placeholder="Email address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
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
        title="Send Reset Email"
        loading={props.loading}
        onPress={() => props.onSubmit(email)}
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
    lineHeight: 23,
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
