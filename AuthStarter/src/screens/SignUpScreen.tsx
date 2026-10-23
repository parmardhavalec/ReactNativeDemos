
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AuthInput from '../components/AuthInput';
import PrimaryButton from '../components/PrimaryButton';

type Props = {
  loading: boolean;
  message: string;
  messageIsError: boolean;
  onSignUp: (
    email: string,
    password: string,
    confirmPassword: string
  ) => void;
  onSignIn: () => void;
};

export default function SignUpScreen(props: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>
          Sign up to get started
        </Text>

        <AuthInput
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <AuthInput
          placeholder="Password (at least 6 characters)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
        />

        <AuthInput
          placeholder="Confirm password"
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
          title="Create Account"
          loading={props.loading}
          onPress={() =>
            props.onSignUp(email, password, confirmPassword)
          }
        />

        <Pressable onPress={props.onSignIn}>
          <Text style={styles.link}>Already have an account? Sign in</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f6f8fc',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#172033',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#667085',
    marginBottom: 28,
  },
  message: { marginBottom: 14, lineHeight: 21 },
  error: { color: '#c62828' },
  success: { color: '#18794e' },
  link: {
    color: '#315ee7',
    textAlign: 'center',
    marginTop: 14,
    fontWeight: '500',
  },
});
