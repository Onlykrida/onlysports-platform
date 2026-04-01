import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import CachedImage from '@/components/CachedImage';
import { Sparkles, MessageCircle, Bookmark, ChevronRight } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { User } from '@/types';

interface AIScoutCardProps {
  athlete: User;
  fitScore: number;
  reasoning: string;
  onMessage?: (athlete: User) => void;
  onShortlist?: (athlete: User) => void;
}

function FitScoreRing({ score }: { score: number }) {
  const color =
    score >= 80 ? theme.colors.primary : score >= 60 ? theme.colors.accent : theme.colors.cyan;

  return (
    <View style={[styles.scoreRing, { borderColor: color }]}>
      <Text style={[styles.scoreText, { color }]}>{score}</Text>
      <Text style={styles.scoreLabel}>fit</Text>
    </View>
  );
}

export default function AIScoutCard({
  athlete,
  fitScore,
  reasoning,
  onMessage,
  onShortlist,
}: AIScoutCardProps) {
  const handleViewProfile = useCallback(() => {
    router.push(`/user/${athlete.id}`);
  }, [athlete.id]);

  return (
    <View style={styles.container}>
      {/* AI badge */}
      <View style={styles.aiBadge}>
        <Sparkles size={10} color={theme.colors.primary} />
        <Text style={styles.aiBadgeText}>AI Recommended</Text>
      </View>

      <View style={styles.cardContent}>
        {/* Left: Avatar + Score */}
        <View style={styles.leftSection}>
          <CachedImage source={athlete.avatar} size={56} placeholder="avatar" />
          <FitScoreRing score={fitScore} />
        </View>

        {/* Center: Info */}
        <View style={styles.centerSection}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {athlete.name}
            </Text>
            {athlete.verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>V</Text>
              </View>
            )}
          </View>
          <Text style={styles.meta} numberOfLines={1}>
            {athlete.sport || 'Athlete'} {athlete.position ? `• ${athlete.position}` : ''}
          </Text>
          {athlete.location && (
            <Text style={styles.location} numberOfLines={1}>
              {athlete.location}
            </Text>
          )}
          <Text style={styles.reasoning} numberOfLines={2}>
            {reasoning}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {onMessage && (
          <TouchableOpacity style={styles.actionButton} onPress={() => onMessage(athlete)}>
            <MessageCircle size={16} color={theme.colors.primary} />
            <Text style={styles.actionText}>Message</Text>
          </TouchableOpacity>
        )}
        {onShortlist && (
          <TouchableOpacity style={styles.actionButton} onPress={() => onShortlist(athlete)}>
            <Bookmark size={16} color={theme.colors.accent} />
            <Text style={styles.actionText}>Shortlist</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.viewButton} onPress={handleViewProfile}>
          <Text style={styles.viewButtonText}>View Profile</Text>
          <ChevronRight size={14} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.12)',
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.primaryLight,
  },
  aiBadgeText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  cardContent: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  leftSection: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.cardBg,
  },
  scoreRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },
  scoreLabel: {
    fontSize: 8,
    color: theme.colors.textMuted,
    marginTop: -2,
  },
  centerSection: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  name: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 9,
    color: theme.colors.background,
    fontWeight: theme.fontWeight.bold,
  },
  meta: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  location: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  reasoning: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.cyan,
    fontStyle: 'italic',
    marginTop: theme.spacing.xs,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.cardBg,
  },
  actionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 'auto',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  viewButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
});
