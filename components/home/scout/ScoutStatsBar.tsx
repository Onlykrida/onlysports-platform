import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/constants/theme';

interface ScoutStatsBarProps {
  matchedCount: number;
  shortlistCount: number;
  contactedCount: number;
}

const ScoutStatsBar: React.FC<ScoutStatsBarProps> = ({
  matchedCount,
  shortlistCount,
  contactedCount,
}) => (
  <View style={styles.statsBar}>
    <View style={styles.statItem}>
      <Text style={styles.statValue} numberOfLines={1}>
        {matchedCount}
      </Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        ATHLETES MATCHED
      </Text>
    </View>
    <View style={styles.statDivider} />
    <View style={styles.statItem}>
      <Text style={styles.statValue} numberOfLines={1}>
        {shortlistCount}
      </Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        SHORTLISTED
      </Text>
    </View>
    <View style={styles.statDivider} />
    <View style={styles.statItem}>
      <Text style={styles.statValue} numberOfLines={1}>
        {contactedCount}
      </Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        CONTACTED
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  statsBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.md,
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
    fontSize: 28,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.cardBorder,
    marginVertical: 4,
  },
});

export default React.memo(ScoutStatsBar);
