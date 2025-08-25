import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { User, Trophy, Users, Building2, Heart } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { Button } from '@/components/Button';
import { UserRole } from '@/types';

const { width } = Dimensions.get('window');

interface RoleOption {
  id: UserRole;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const roles: RoleOption[] = [
  {
    id: 'athlete',
    title: 'Athlete',
    description: 'Showcase your talent and get discovered by scouts',
    icon: <Trophy size={32} color={theme.colors.white} />,
    color: theme.colors.accent,
  },
  {
    id: 'coach',
    title: 'Coach',
    description: 'Train athletes and build championship teams',
    icon: <User size={32} color={theme.colors.white} />,
    color: theme.colors.success,
  },
  {
    id: 'scout',
    title: 'Scout',
    description: 'Discover and recruit talented athletes',
    icon: <Users size={32} color={theme.colors.white} />,
    color: theme.colors.secondary,
  },
  {
    id: 'team',
    title: 'Team/Club',
    description: 'Build your roster and manage your organization',
    icon: <Building2 size={32} color={theme.colors.white} />,
    color: theme.colors.primary,
  },
  {
    id: 'fan',
    title: 'Fan',
    description: 'Follow your favorite athletes and teams',
    icon: <Heart size={32} color={theme.colors.white} />,
    color: theme.colors.danger,
  },
];

export default function RoleSelectionScreen() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleContinue = () => {
    if (selectedRole) {
      router.push({
        pathname: '/signup',
        params: { role: selectedRole },
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Role</Text>
          <Text style={styles.subtitle}>
            Select how you want to use OnlySports
          </Text>
        </View>

        <View style={styles.rolesContainer}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              style={[
                styles.roleCard,
                selectedRole === role.id && styles.roleCardSelected,
                { borderColor: selectedRole === role.id ? role.color : theme.colors.border },
              ]}
              onPress={() => setSelectedRole(role.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: role.color },
                ]}
              >
                {role.icon}
              </View>
              <View style={styles.roleContent}>
                <Text style={styles.roleTitle}>{role.title}</Text>
                <Text style={styles.roleDescription}>{role.description}</Text>
              </View>
              <View
                style={[
                  styles.radio,
                  selectedRole === role.id && styles.radioSelected,
                  selectedRole === role.id && { backgroundColor: role.color },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Button
            title="Continue"
            onPress={handleContinue}
            disabled={!selectedRole}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  rolesContainer: {
    flex: 1,
    gap: theme.spacing.md,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  roleCardSelected: {
    backgroundColor: theme.colors.surface,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  roleDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  radioSelected: {
    borderColor: 'transparent',
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
});