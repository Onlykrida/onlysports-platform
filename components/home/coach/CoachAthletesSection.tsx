import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Trophy } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { FLATLIST_PERF_PROPS } from '@/constants/performance';
import CachedImage from '@/components/CachedImage';
import SectionHeader from '@/components/home/shared/SectionHeader';
import type { User } from '@/types';

interface CoachAthletesSectionProps {
  athletes: User[];
  isLoading: boolean;
  onUserPress: (userId: string) => void;
}

const AthleteChip = React.memo(function AthleteChip({
  item,
  onPress,
}: {
  item: User;
  onPress: (userId: string) => void;
}) {
  return (
    <TouchableOpacity
      style={styles.athleteChip}
      onPress={() => onPress(item.id)}
      activeOpacity={0.7}
    >
      <CachedImage source={item.avatar} size={32} placeholder="avatar" />
      <View style={{ flex: 1 }}>
        <Text style={styles.athleteChipName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.athleteChipMeta} numberOfLines={1} ellipsizeMode="tail">
          {item.sport || 'Athlete'}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

const CoachAthletesSection: React.FC<CoachAthletesSectionProps> = ({
  athletes,
  isLoading,
  onUserPress,
}) => {
  const renderAthleteChip = useCallback(
    ({ item }: { item: User }) => <AthleteChip item={item} onPress={onUserPress} />,
    [onUserPress],
  );

  return (
    <View style={styles.sectionContainer}>
      <SectionHeader
        title="YOUR ATHLETES"
        count={athletes.length > 0 ? athletes.length : undefined}
      />

      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={theme.colors.primary}
          style={{ padding: theme.spacing.lg }}
        />
      ) : athletes.length === 0 ? (
        <View style={styles.emptyCard}>
          <Trophy size={24} color={theme.colors.textMuted} />
          <Text style={styles.emptyText}>No athletes yet</Text>
          <Text style={styles.emptySubtext}>
            Express interest in athletes to start building your roster
          </Text>
        </View>
      ) : (
        <FlatList
          data={athletes}
          renderItem={renderAthleteChip}
          keyExtractor={(item, index) => item.id ?? `athlete-${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.athleteListContent}
          {...FLATLIST_PERF_PROPS}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  emptyCard: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginHorizontal: theme.spacing.sm,
    ...theme.dashBorder,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  athleteListContent: {
    paddingHorizontal: 0,
    gap: theme.spacing.sm,
  },
  athleteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    paddingRight: theme.spacing.md,
    ...theme.dashBorder,
    width: 160,
    gap: theme.spacing.sm,
  },
  athleteChipName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  athleteChipMeta: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
  },
});

export default React.memo(CoachAthletesSection);
