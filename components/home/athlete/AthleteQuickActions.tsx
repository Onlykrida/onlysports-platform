import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Dumbbell, ChevronRight } from 'lucide-react-native';
import { theme } from '@/constants/theme';

interface AthleteQuickActionsProps {
  onLogTraining?: () => void;
}

const AthleteQuickActions = React.memo(function AthleteQuickActions({
  onLogTraining,
}: AthleteQuickActionsProps) {
  return (
    <TouchableOpacity style={styles.trainingLogButton} activeOpacity={0.7} onPress={onLogTraining}>
      <Dumbbell size={20} color={theme.colors.primary} />
      <Text style={styles.trainingLogText}>LOG TRAINING SESSION</Text>
      <ChevronRight size={18} color={theme.colors.textMuted} />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  trainingLogButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.cardBorder,
    gap: theme.spacing.md,
  },
  trainingLogText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    letterSpacing: 1,
  },
});

export default AthleteQuickActions;
