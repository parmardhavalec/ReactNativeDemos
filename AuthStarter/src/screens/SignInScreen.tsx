
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
  showResend: boolean;
  onSignIn: (email: string, password: string) => void;
  onSignUp: () => void;
  onForgotPassword: () => void;
  onResend: () => void;
};

export default function SignInScreen(props: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        <AuthInput
          label="Email address"
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <AuthInput
          label="Password"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
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
          title="Sign In"
          loading={props.loading}
          onPress={() => props.onSignIn(email, password)}
        />

        <Pressable onPress={props.onForgotPassword}>
          <Text style={styles.link}>Forgot your password?</Text>
        </Pressable>

        {props.showResend && (
          <Pressable onPress={props.onResend} disabled={props.loading}>
            <Text style={styles.link}>Resend confirmation email</Text>
          </Pressable>
        )}

        <Pressable onPress={props.onSignUp}>
          <Text style={styles.link}>Create a new account</Text>
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
