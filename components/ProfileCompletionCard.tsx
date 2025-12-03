import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { ArrowRight, CheckCircle, AlertCircle } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { User } from '@/types';
import { calculateProfileCompletion, getProfileCompletionMessage, getProfileCompletionColor, getMissingProfileFields } from '@/constants/profile-completion';

interface ProfileCompletionCardProps {
  user: User;
  onCompleteProfile: () => void;
}

export function ProfileCompletionCard({ user, onCompleteProfile }: ProfileCompletionCardProps) {
  const score = calculateProfileCompletion(user);
  const message = getProfileCompletionMessage(score);
  const color = getProfileCompletionColor(score);
  const missingFields = getMissingProfileFields(user);
  
  if (score >= 90) {
    return (
      <View style={styles.container}>
        <View style={styles.completeContainer}>
          <CheckCircle size={24} color="#10b981" />
          <Text style={styles.completeText}>Profile Complete!</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.container} onPress={onCompleteProfile} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <AlertCircle size={20} color={color} />
          <Text style={styles.title}>Complete Your Profile</Text>
        </View>
        <Text style={[styles.score, { color }]}>{score}%</Text>
      </View>
      
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${score}%`, backgroundColor: color }]} />
        </View>
      </View>
      
      <Text style={styles.message}>{message}</Text>
      
      {missingFields.length > 0 && missingFields.length <= 3 && (
        <View style={styles.missingFields}>
          <Text style={styles.missingFieldsLabel}>Add:</Text>
          <View style={styles.missingFieldsList}>
            {missingFields.slice(0, 3).map((field, index) => (
              <View key={field} style={styles.missingFieldItem}>
                <Text style={styles.missingFieldText}>{field}</Text>
                {index < missingFields.slice(0, 3).length - 1 && (
                  <Text style={styles.missingFieldSeparator}>•</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}
      
      <View style={styles.action}>
        <Text style={styles.actionText}>Complete Profile</Text>
        <ArrowRight size={16} color={theme.colors.primary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  score: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.black,
  },
  progressBarContainer: {
    marginBottom: theme.spacing.md,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
  message: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  missingFields: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    flexWrap: 'wrap',
  },
  missingFieldsLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.xs,
    fontWeight: theme.fontWeight.medium,
  },
  missingFieldsList: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  missingFieldItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  missingFieldText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  missingFieldSeparator: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginHorizontal: theme.spacing.xs,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  actionText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  completeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  completeText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: '#10b981',
  },
});
