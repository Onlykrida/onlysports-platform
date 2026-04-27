import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Mail, Lock } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuth } from '@/hooks/auth-context';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await login(email, password);

      if (result.error) {
        setErrors({ general: result.error });
      }
      // Navigation handled by Redirect in _layout.tsx when isAuthenticated changes
    } catch (error) {
      if (__DEV__) console.error('Login error:', error);
      setErrors({ general: 'Login failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.logo}>ONLYKRIDA</Text>
            <Text style={styles.title}>WELCOME BACK</Text>
            <Text style={styles.subtitle}>YOUR TALENT IS WAITING.</Text>
          </View>

          <View style={styles.form}>
            {errors.general && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errors.general}</Text>
              </View>
            )}

            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              type="email"
              error={errors.email}
              icon={<Mail size={20} color={theme.colors.textSecondary} />}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              type="password"
              error={errors.password}
              icon={<Lock size={20} color={theme.colors.textSecondary} />}
            />

            <TouchableOpacity
              style={styles.forgotPassword}
              accessibilityRole="link"
              accessibilityLabel="Forgot password"
              onPress={() =>
                Alert.alert(
                  'Reset Password',
                  'Password reset email will be sent to your email address. This feature is coming soon.',
                )
              }
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Button title="Sign In" onPress={handleLogin} loading={loading} size="large" />

            <TouchableOpacity
              onPress={() => router.push('/(auth)/role-selection' as any)}
              style={styles.signupLink}
              accessibilityRole="link"
              accessibilityLabel="Sign up for a new account"
            >
              <Text style={styles.signupText}>
                Don&apos;t have an account? <Text style={styles.signupTextBold}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logo: {
    fontSize: 36,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.primary,
    marginBottom: theme.spacing.lg,
    letterSpacing: 4,
    textShadowColor: 'rgba(48, 209, 88, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.orange,
    fontWeight: theme.fontWeight.semibold,
    letterSpacing: 2,
  },
  form: {
    flex: 1,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: theme.spacing.sm,
  },
  forgotPasswordText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.orange,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  footer: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  signupLink: {
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  signupText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  signupTextBold: {
    fontWeight: theme.fontWeight.black,
    color: theme.colors.orange,
  },
  errorContainer: {
    backgroundColor: theme.colors.dangerBg,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.3)',
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 0.5,
  },
});
