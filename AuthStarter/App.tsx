
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Linking from 'expo-linking';
import type { Session } from '@supabase/supabase-js';

import { supabase } from './src/lib/supabase';
import {
  signIn,
  signUp,
  resendVerificationEmail,
  sendPasswordResetEmail,
  updatePassword,
  signOut,
} from './src/services/authService';

import SignInScreen from './src/screens/SignInScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import HomeScreen from './src/screens/HomeScreen';

type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState('');
  const [messageIsError, setMessageIsError] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  const showMessage = (text: string, isError = false) => {
    setMessage(text);
    setMessageIsError(isError);
  };

  const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : 'Something went wrong.';

  // Restore the existing session and listen for authentication changes.
  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) {
        setSession(nextSession);
        setInitializing(false);
      }
    });

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;

        if (error) {
          showMessage(error.message, true);
        }

        setSession(data.session);
        setInitializing(false);
      })
      .catch((error: unknown) => {
        if (!mounted) return;
        showMessage(getErrorMessage(error), true);
        setInitializing(false);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Process email confirmation and password recovery deep links.
  useEffect(() => {
    let mounted = true;
    const processedUrls = new Set<string>();

    const handleIncomingUrl = async (url: string) => {
      if (processedUrls.has(url)) return;
      processedUrls.add(url);

      try {
        const parsedUrl = new URL(url);
        const query = parsedUrl.searchParams;
        const hash = new URLSearchParams(
          parsedUrl.hash.replace(/^#/, '')
        );

        const getParam = (key: string) =>
          query.get(key) ?? hash.get(key);

        const type = getParam('type');
        const code = getParam('code');
        const accessToken = getParam('access_token');
        const refreshToken = getParam('refresh_token');
        const linkError =
          getParam('error_description') ?? getParam('error');

        if (linkError) {
          if (!mounted) return;

          if (type === 'recovery' || url.includes('reset-password')) {
            setMode('reset');
          }

          showMessage(
            decodeURIComponent(linkError.replace(/\+/g, ' ')),
            true
          );
          return;
        }

        // Keep reset mode active while Supabase exchanges the recovery link.
        if (
          type === 'recovery' ||
          parsedUrl.pathname.includes('reset-password')
        ) {
          if (mounted) setMode('reset');
        }

        if (code) {
          const { error } =
            await supabase.auth.exchangeCodeForSession(code);

          if (error) throw error;
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;
        }

        if (!mounted) return;

        if (type === 'signup') {
          setVerificationEmail('');
          setMode('signin');
          showMessage(
            'Email confirmed successfully. You can now sign in.'
          );
        } else if (type === 'recovery') {
          setMode('reset');
          showMessage('Enter your new password.');
        }
      } catch (error: unknown) {
        if (!mounted) return;
        showMessage(getErrorMessage(error), true);
      }
    };

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleIncomingUrl(url);
    });

    Linking.getInitialURL().then((url) => {
      if (url) void handleIncomingUrl(url);
    }).catch((error: unknown) => {
      if (mounted) showMessage(getErrorMessage(error), true);
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  const runAction = async (action: () => Promise<void>) => {
    setLoading(true);
    showMessage('');

    try {
      await action();
    } catch (error: unknown) {
      showMessage(getErrorMessage(error), true);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = (email: string, password: string) =>
    runAction(async () => {
      if (!email.trim() || !password) {
        throw new Error('Enter your email address and password.');
      }

      await signIn(email, password);
      showMessage('Signed in successfully.');
    });

  const handleSignUp = (
    email: string,
    password: string,
    confirmPassword: string
  ) =>
    runAction(async () => {
      if (!email.trim()) {
        throw new Error('Enter your email address.');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match.');
      }

      const data = await signUp(email, password);

      if (data.session) {
        setMode('signin');
        showMessage('Account created successfully.');
      } else {
        setVerificationEmail(email.trim().toLowerCase());
        setMode('signin');
        showMessage(
          'Please check your inbox and verify your email before signing in.'
        );
      }
    });

  const handleResendVerification = () =>
    runAction(async () => {
      const email = verificationEmail.trim();

      if (!email) {
        throw new Error('No verification email is available.');
      }

      await resendVerificationEmail(email);
      showMessage(
        'If confirmation is still pending, check your inbox for a new verification email.'
      );
    });

  const handleForgotPassword = (email: string) =>
    runAction(async () => {
      if (!email.trim()) {
        throw new Error('Enter your email address.');
      }

      await sendPasswordResetEmail(email);
      showMessage(
        'If an account exists for that email, a password reset link has been sent.'
      );
    });

  const handleResetPassword = (
    password: string,
    confirmPassword: string
  ) =>
    runAction(async () => {
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match.');
      }

      await updatePassword(password);
      await signOut();

      setMode('signin');
      showMessage('Password updated successfully. Please sign in.');
    });

  const handleLogout = () =>
    runAction(async () => {
      await signOut();
      setMode('signin');
      showMessage('You have signed out.');
    });

  const navigateTo = (nextMode: AuthMode) => {
    setMode(nextMode);
    showMessage('');
  };

  if (initializing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#315ee7" />
        <Text style={styles.loadingText}>Loading your account...</Text>
      </View>
    );
  }

  // Reset mode takes priority because a recovery link can establish a session.
  if (mode === 'reset') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ResetPasswordScreen
          loading={loading}
          message={message}
          messageIsError={messageIsError}
          onSubmit={handleResetPassword}
          onBack={() => navigateTo('signin')}
        />
      </SafeAreaView>
    );
  }

  if (session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <HomeScreen
          email={session.user.email ?? ''}
          loading={loading}
          onLogout={handleLogout}
        />
      </SafeAreaView>
    );
  }

  const sharedProps = {
    loading,
    message,
    messageIsError,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {mode === 'signup' && (
        <SignUpScreen
          {...sharedProps}
          onSignUp={handleSignUp}
          onSignIn={() => navigateTo('signin')}
        />
      )}

      {mode === 'forgot' && (
        <ForgotPasswordScreen
          {...sharedProps}
          onSubmit={handleForgotPassword}
          onBack={() => navigateTo('signin')}
        />
      )}

      {mode === 'signin' && (
        <SignInScreen
          {...sharedProps}
          showResend={verificationEmail !== ''}
          onSignIn={handleSignIn}
          onSignUp={() => navigateTo('signup')}
          onForgotPassword={() => navigateTo('forgot')}
          onResend={handleResendVerification}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6f8fc',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f6f8fc',
  },
  loadingText: {
    marginTop: 12,
    color: '#667085',
  },
});




/*
d.mycompany@gmail.com
Dhaval@1234
*/