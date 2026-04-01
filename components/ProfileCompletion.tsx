import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { theme } from '@/constants/theme';
import { User } from '@/types';

interface ProfileCompletionProps {
  user: User;
  postsCount: number;
}

interface CompletionStep {
  key: string;
  label: string;
  completed: boolean;
  action?: () => void;
  impact: string;
}

export default function ProfileCompletion({ user, postsCount }: ProfileCompletionProps) {
  const steps = useMemo(
    (): CompletionStep[] => [
      {
        key: 'avatar',
        label: 'Add profile photo',
        completed: !!user.avatar,
        impact: '2x more profile views',
      },
      {
        key: 'bio',
        label: 'Write your bio',
        completed: !!user.bio && user.bio.length > 20,
        action: () => router.push('/edit-profile' as any),
        impact: '3x more scout interest',
      },
      {
        key: 'sport',
        label: 'Set your sport & position',
        completed: !!user.sport,
        action: () => router.push('/edit-profile' as any),
        impact: 'Appear in scout searches',
      },
      {
        key: 'location',
        label: 'Add your location',
        completed: !!user.location,
        action: () => router.push('/edit-profile' as any),
        impact: 'Local scouts find you',
      },
      {
        key: 'post',
        label: 'Share your first highlight',
        completed: postsCount > 0,
        action: () => router.push('/(tabs)/create' as any),
        impact: '5x more engagement',
      },
    ],
    [user, postsCount],
  );

  const completedCount = steps.filter((s) => s.completed).length;
  const percentage = Math.round((completedCount / steps.length) * 100);
  const nextStep = steps.find((s) => !s.completed);

  if (percentage === 100) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile Strength</Text>
        <Text
          style={[
            styles.percentage,
            percentage >= 80
              ? styles.percentageHigh
              : percentage >= 40
                ? styles.percentageMed
                : styles.percentageLow,
          ]}
        >
          {percentage}%
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percentage}%` }]} />
      </View>

      {/* Steps */}
      <View style={styles.steps}>
        {steps.map((step) => (
          <TouchableOpacity
            key={step.key}
            style={styles.step}
            onPress={step.action}
            disabled={step.completed || !step.action}
            activeOpacity={0.7}
          >
            {step.completed ? (
              <CheckCircle size={18} color={theme.colors.primary} />
            ) : (
              <Circle size={18} color={theme.colors.textMuted} />
            )}
            <View style={styles.stepContent}>
              <Text style={[styles.stepLabel, step.completed && styles.stepCompleted]}>
                {step.label}
              </Text>
              {!step.completed && <Text style={styles.stepImpact}>{step.impact}</Text>}
            </View>
            {!step.completed && step.action && (
              <ArrowRight size={14} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {nextStep && (
        <Text style={styles.encouragement}>Complete your next step to stand out to scouts!</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  percentage: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.extrabold,
  },
  percentageHigh: { color: theme.colors.primary },
  percentageMed: { color: theme.colors.accent },
  percentageLow: { color: theme.colors.red },
  progressTrack: {
    height: 6,
    backgroundColor: theme.colors.cardBg,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  steps: {
    gap: theme.spacing.sm,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  stepContent: {
    flex: 1,
  },
  stepLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  stepCompleted: {
    color: theme.colors.textMuted,
    textDecorationLine: 'line-through',
  },
  stepImpact: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    marginTop: 1,
  },
  encouragement: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    fontStyle: 'italic',
  },
});
