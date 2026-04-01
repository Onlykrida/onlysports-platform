import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Eye, Users, Play } from 'lucide-react-native';
import { theme } from '@/constants/theme';

interface AthleteStatsBarProps {
  profileViews: number;
  interestedCount: number;
  highlightViews: number;
}

const AthleteStatsBar = React.memo(function AthleteStatsBar({
  profileViews,
  interestedCount,
  highlightViews,
}: AthleteStatsBarProps) {
  return (
    <View style={styles.statsBar}>
      <View style={styles.statItem}>
        <Eye size={16} color={theme.colors.primary} />
        <Text style={styles.statValue} numberOfLines={1}>
          {profileViews}
        </Text>
        <Text style={styles.statLabel} numberOfLines={1}>
          PROFILE VIEWS
        </Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Users size={16} color={theme.colors.warning} />
        <Text style={styles.statValue} numberOfLines={1}>
          {interestedCount}
        </Text>
        <Text style={styles.statLabel} numberOfLines={1}>
          INTERESTED
        </Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Play size={16} color={theme.colors.cyan} />
        <Text style={styles.statValue} numberOfLines={1}>
          {highlightViews}
        </Text>
        <Text style={styles.statLabel} numberOfLines={1}>
          HIGHLIGHT VIEWS
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  statsBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.cardBorder,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textMuted,
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.cardBorder,
    marginVertical: 4,
  },
});

export default AthleteStatsBar;
