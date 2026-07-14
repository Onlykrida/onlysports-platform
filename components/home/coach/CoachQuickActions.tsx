import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Target, Search, MessageSquare } from 'lucide-react-native';
import { theme } from '@/constants/theme';

interface CoachQuickActionsProps {
  onPostTrial: () => void;
  onFindAthletes: () => void;
  onMessages: () => void;
}

const QuickActionCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}> = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.quickActionCard} onPress={onPress} activeOpacity={0.7}>
    {icon}
    <Text style={styles.quickActionLabel} numberOfLines={1} ellipsizeMode="tail">
      {label}
    </Text>
  </TouchableOpacity>
);

const CoachQuickActions: React.FC<CoachQuickActionsProps> = ({
  onPostTrial,
  onFindAthletes,
  onMessages,
}) => (
  <View style={styles.quickActionsRow}>
    <QuickActionCard
      icon={<Target size={22} color={theme.colors.primary} />}
      label="POST TRIAL"
      onPress={onPostTrial}
    />
    <QuickActionCard
      icon={<Search size={22} color={theme.colors.cyan} />}
      label="FIND ATHLETES"
      onPress={onFindAthletes}
    />
    <QuickActionCard
      icon={<MessageSquare size={22} color={theme.colors.warning} />}
      label="MESSAGES"
      onPress={onMessages}
    />
  </View>
);

const styles = StyleSheet.create({
  quickActionsRow: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    gap: theme.spacing.sm,
    ...theme.dashBorder,
  },
  quickActionLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    textAlign: 'center',
  },
});

export default React.memo(CoachQuickActions);
