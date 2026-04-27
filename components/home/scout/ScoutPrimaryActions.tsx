import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SlidersHorizontal, Search, ArrowRight } from 'lucide-react-native';
import { theme } from '@/constants/theme';

interface Props {
  onRefineMatches: () => void;
  onBrowseAll: () => void;
}

// Sits between ScoutStatsBar and TOP MATCHES on the scout dashboard. Gives
// a premium scout a primary action ("Refine your search") and a secondary
// affordance ("Browse all") — the previous layout went straight from three
// small stat counters to athlete cards with nothing actionable in between.
const ScoutPrimaryActions: React.FC<Props> = ({ onRefineMatches, onBrowseAll }) => (
  <View style={styles.container}>
    <TouchableOpacity style={styles.primaryButton} onPress={onRefineMatches} activeOpacity={0.85}>
      <View style={styles.primaryLeft}>
        <View style={styles.iconBadgePrimary}>
          <SlidersHorizontal size={18} color={theme.colors.black} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.primaryTitle}>Refine your search</Text>
          <Text style={styles.primarySubtitle}>
            Tune sport, position, and fitness-zone weights to surface better matches
          </Text>
        </View>
      </View>
      <ArrowRight size={18} color={theme.colors.black} />
    </TouchableOpacity>

    <TouchableOpacity style={styles.secondaryButton} onPress={onBrowseAll} activeOpacity={0.7}>
      <Search size={16} color={theme.colors.text} />
      <Text style={styles.secondaryText}>Browse all athletes</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  primaryLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  iconBadgePrimary: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.black,
  },
  primarySubtitle: {
    fontSize: theme.fontSize.xs,
    color: 'rgba(0,0,0,0.7)',
    marginTop: 2,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    ...theme.dashBorder,
  },
  secondaryText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
});

export default React.memo(ScoutPrimaryActions);
