import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import CachedImage from '@/components/CachedImage';
import { Star, ChevronDown, ChevronUp } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { User } from '@/types';
import SectionHeader from '@/components/home/shared/SectionHeader';

interface ShortlistSectionProps {
  shortlist: Array<{
    id: string;
    athlete_id: string;
    athlete?: User;
    notes?: string;
  }>;
  expanded: boolean;
  onToggleExpand: () => void;
  onUserPress: (userId: string) => void;
  getUserForId: (id: string) => User | undefined;
}

const ShortlistSection: React.FC<ShortlistSectionProps> = ({
  shortlist,
  expanded,
  onToggleExpand,
  onUserPress,
  getUserForId,
}) => (
  <View style={styles.sectionContainer}>
    <TouchableOpacity
      style={styles.sectionHeaderTouchable}
      onPress={onToggleExpand}
      activeOpacity={0.7}
    >
      <SectionHeader title="MY SHORTLIST" count={shortlist.length} />
      {expanded ? (
        <ChevronUp size={18} color={theme.colors.textMuted} />
      ) : (
        <ChevronDown size={18} color={theme.colors.textMuted} />
      )}
    </TouchableOpacity>

    {expanded &&
      (shortlist.length === 0 ? (
        <View style={styles.emptyCard}>
          <Star size={24} color={theme.colors.textMuted} />
          <Text style={styles.emptyText}>No athletes shortlisted yet</Text>
          <Text style={styles.emptySubtext}>Shortlist athletes from your top matches above</Text>
        </View>
      ) : (
        <View>
          {shortlist.map((entry) => {
            const athlete = entry.athlete || getUserForId(entry.athlete_id);
            if (!athlete) return null;
            return (
              <TouchableOpacity
                key={entry.id}
                style={styles.shortlistCard}
                onPress={() => onUserPress(entry.athlete_id)}
              >
                <CachedImage source={athlete.avatar} size={36} placeholder="avatar" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.shortlistName} numberOfLines={1}>
                    {athlete.name}
                  </Text>
                  <Text style={styles.shortlistMeta} numberOfLines={1} ellipsizeMode="tail">
                    {athlete.sport || 'Sport'} {athlete.position ? `/ ${athlete.position}` : ''}
                  </Text>
                </View>
                {entry.notes ? (
                  <Text style={styles.shortlistNotes} numberOfLines={1}>
                    {entry.notes}
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
  </View>
);

const styles = StyleSheet.create({
  sectionContainer: {
    marginHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  sectionHeaderTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shortlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.cardBorder,
    gap: theme.spacing.sm,
  },
  shortlistName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  shortlistMeta: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  shortlistNotes: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    maxWidth: 80,
  },
  emptyCard: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginHorizontal: theme.spacing.sm,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.cardBorder,
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
});

export default React.memo(ShortlistSection);
