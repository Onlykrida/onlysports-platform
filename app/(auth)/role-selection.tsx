import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { User, Trophy, Users, Building2, Heart, Dumbbell } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { Button } from '@/components/Button';
import { UserRole } from '@/types';


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
    id: 'trainer',
    title: 'Gym Trainer',
    description: 'Coach athletes in strength and conditioning',
    icon: <Dumbbell size={32} color={theme.colors.white} />,
    color: theme.colors.warning ?? theme.colors.secondary,
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
      const routeMap: Record<UserRole, string> = {
        athlete: '/(auth)/signup-athlete',
        coach: '/(auth)/signup-coach',
        scout: '/(auth)/signup-scout',
        team: '/(auth)/signup-team',
        fan: '/(auth)/signup',
        trainer: '/(auth)/signup-trainer',
        academy: '/(auth)/signup-academy',
        brand: '/(auth)/signup-brand',
        gym: '/(auth)/signup-gym',
      };
      router.push({ pathname: routeMap[selectedRole] as any, params: { role: selectedRole } });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Role</Text>
          <Text style={styles.subtitle}>
            Select how you want to use OnlyKrida
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
            onPress={() => router.push('/(auth)/login' as any)}
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
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  roleCardSelected: {
    backgroundColor: theme.colors.surfaceLight,
    ...theme.shadow.electric,
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
    borderColor: theme.colors.borderLight,
    backgroundColor: 'transparent',
  },
  radioSelected: {
    borderColor: 'transparent',
    borderWidth: 3,
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