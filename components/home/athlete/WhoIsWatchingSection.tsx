import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Eye } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { FLATLIST_PERF_PROPS } from '@/constants/performance';
import SectionHeader from '@/components/home/shared/SectionHeader';
import UserCard from '@/components/home/shared/UserCard';
import { User } from '@/types';

interface WhoIsWatchingSectionProps {
  interestedOrgs: User[];
  isLoading: boolean;
  onUserPress: (userId: string) => void;
}

const WhoIsWatchingSection = React.memo(function WhoIsWatchingSection({
  interestedOrgs,
  isLoading,
  onUserPress,
}: WhoIsWatchingSectionProps) {
  return (
    <View style={styles.sectionContainer}>
      <SectionHeader
        title="WHO'S WATCHING YOU"
        count={interestedOrgs.length > 0 ? interestedOrgs.length : undefined}
      />

      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={theme.colors.primary}
          style={{ padding: theme.spacing.lg }}
        />
      ) : interestedOrgs.length === 0 ? (
        <View style={styles.emptyWatchingCard}>
          <Eye size={24} color={theme.colors.textMuted} />
          <Text style={styles.emptyWatchingText}>No scouts or coaches watching yet</Text>
          <Text style={styles.emptyWatchingSubtext}>
            Complete your profile and post highlights to get noticed
          </Text>
        </View>
      ) : (
        <FlatList
          data={interestedOrgs}
          renderItem={({ item }) => (
            <UserCard user={item} variant="full" onPress={() => onUserPress(item.id)} />
          )}
          keyExtractor={(item, index) => item.id ?? `org-${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.orgsListContent}
          {...FLATLIST_PERF_PROPS}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  sectionContainer: {
    marginHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  emptyWatchingCard: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.cardBorder,
  },
  emptyWatchingText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  emptyWatchingSubtext: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  orgsListContent: {
    paddingHorizontal: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
});

export default WhoIsWatchingSection;
