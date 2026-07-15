import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/auth-context';
import { router } from 'expo-router';
import CreateOpportunityModal from '@/components/CreateOpportunityModal';

// Thin route wrapper around the real create flow.
//
// This page used to be a 680-line bespoke form whose submit handler logged,
// showed a "Success" alert, and never wrote to the database — teams thought
// they posted trials that no athlete could ever see (and on web the fake
// success wasn't even visible, since Alert.alert is a no-op there).
// CreateOpportunityModal is the validated implementation that actually calls
// createOpportunity(); Team Home's "Post New Opportunity" routes here.
export default function CreateOpportunityScreen() {
  const { user } = useAuth();

  const canCreate =
    user?.role === 'coach' ||
    user?.role === 'scout' ||
    user?.role === 'team' ||
    user?.role === 'gym' ||
    user?.role === 'brand' ||
    user?.role === 'academy';

  if (!canCreate) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noPermissionContainer}>
          <Text style={styles.noPermissionTitle}>Permission Required</Text>
          <Text style={styles.noPermissionText}>
            Only coaches, scouts, teams, and academies can post opportunities.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CreateOpportunityModal visible onClose={() => router.back()} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  noPermissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  noPermissionTitle: {
    fontSize: theme.fontSize.xl,
    fontFamily: theme.fontFamily.displayBlack,
    color: theme.colors.text,
    letterSpacing: 1,
  },
  noPermissionText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  backButton: {
    minHeight: 48,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.black,
  },
});
