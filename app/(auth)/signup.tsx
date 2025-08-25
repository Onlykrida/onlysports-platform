import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Mail, Lock, User as UserIcon } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { DatabaseSetupChecker } from '@/components/DatabaseSetupChecker';
import { useAuth } from '@/hooks/auth-context';
import { UserRole } from '@/types';

export default function SignupScreen() {
  const { role } = useLocalSearchParams<{ role: UserRole }>();
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await signup(email, password, name, role || 'athlete');
      
      if (result.error) {
        setErrors({ general: result.error });
      } else {
        router.replace('/(tabs)/(home)');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setErrors({ general: 'Signup failed. Please try again.' });
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join as {role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Athlete'}
            </Text>
          </View>

          <View style={styles.form}>
            {errors.general && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errors.general}</Text>
              </View>
            )}
            
            {errors.general && (errors.general.includes('table') || errors.general.includes('Permission denied') || errors.general.includes('policies')) && (
              <DatabaseSetupChecker />
            )}
            
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              error={errors.name}
              icon={<UserIcon size={20} color={theme.colors.textSecondary} />}
            />

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
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              type="password"
              error={errors.password}
              icon={<Lock size={20} color={theme.colors.textSecondary} />}
            />

            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              type="password"
              error={errors.confirmPassword}
              icon={<Lock size={20} color={theme.colors.textSecondary} />}
            />
          </View>

          <View style={styles.footer}>
            <Button
              title="Sign Up"
              onPress={handleSignup}
              loading={loading}
              size="large"
            />

            <TouchableOpacity
              onPress={() => router.push('/login')}
              style={styles.loginLink}
            >
              <Text style={styles.loginText}>
                Already have an account? <Text style={styles.loginTextBold}>Sign In</Text>
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
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  form: {
    flex: 1,
  },
  footer: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  loginLink: {
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  loginText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  loginTextBold: {
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: '#dc2626',
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
  },
});