import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import CachedImage from '@/components/CachedImage';
import { Star, Eye, Shield } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { User } from '@/types';
import { getVerificationLevel } from '@/hooks/scouting-context';
import VerificationBadge from '@/components/VerificationBadge';

interface AthleteMatchCardProps {
  athlete: User;
  fitScore: number;
  isShortlisted: boolean;
  onUserPress: (userId: string) => void;
  onShortlistToggle: (athleteId: string) => void;
  highestVerificationTier?: string;
}

const AthleteMatchCard: React.FC<AthleteMatchCardProps> = ({
  athlete,
  fitScore,
  isShortlisted,
  onUserPress,
  onShortlistToggle,
  highestVerificationTier,
}) => {
  const verLevel = getVerificationLevel(athlete.verified ? 'district' : 'school');

  return (
    <View style={styles.athleteCard}>
      <TouchableOpacity style={styles.athleteInfo} onPress={() => onUserPress(athlete.id)}>
        <CachedImage source={athlete.avatar} size={40} placeholder="avatar" />
        <View style={styles.athleteDetails}>
          <View style={styles.nameRow}>
            <Text style={styles.athleteName} numberOfLines={1}>
              {athlete.name}
            </Text>
            {athlete.verified && (
              <Shield size={14} color={verLevel.color} style={{ marginLeft: 4 }} />
            )}
          </View>
          <Text style={styles.athleteMeta} numberOfLines={1} ellipsizeMode="tail">
            {athlete.sport?.toUpperCase() || 'SPORT'}{' '}
            {athlete.position ? `/ ${athlete.position.toUpperCase()}` : ''}
          </Text>
        </View>
        <View style={styles.fitScoreContainer}>
          <Text style={styles.fitScoreValue} numberOfLines={1}>
            {Math.round(fitScore)}%
          </Text>
          <Text style={styles.fitScoreLabel} numberOfLines={1}>
            FIT
          </Text>
        </View>
      </TouchableOpacity>
      {highestVerificationTier && highestVerificationTier !== 'self_reported' && (
        <VerificationBadge tier={highestVerificationTier as any} size="sm" showLabel />
      )}
      <View style={styles.athleteActions}>
        <TouchableOpacity
          style={[styles.shortlistBtn, isShortlisted && styles.shortlistBtnActive]}
          onPress={() => onShortlistToggle(athlete.id)}
        >
          <Star
            size={14}
            color={isShortlisted ? theme.colors.black : theme.colors.warning}
            fill={isShortlisted ? theme.colors.black : 'transparent'}
          />
          <Text style={[styles.shortlistBtnText, isShortlisted && styles.shortlistBtnTextActive]}>
            {isShortlisted ? 'SHORTLISTED' : 'SHORTLIST'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.viewBtn} onPress={() => onUserPress(athlete.id)}>
          <Eye size={14} color={theme.colors.textSecondary} />
          <Text style={styles.viewBtnText}>VIEW</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  athleteCard: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.sm,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.cardBorder,
  },
  athleteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  athleteDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  athleteName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    letterSpacing: 0.5,
  },
  athleteMeta: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    letterSpacing: 1,
    marginTop: 2,
  },
  fitScoreContainer: {
    alignItems: 'center',
    flexShrink: 0,
  },
  fitScoreValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.primary,
  },
  fitScoreLabel: {
    fontSize: 8,
    color: theme.colors.textMuted,
    letterSpacing: 1,
  },
  athleteActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  shortlistBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.warning,
    backgroundColor: 'transparent',
  },
  shortlistBtnActive: {
    backgroundColor: theme.colors.warning,
    borderStyle: 'solid',
  },
  shortlistBtnText: {
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.warning,
    letterSpacing: 1,
  },
  shortlistBtnTextActive: {
    color: theme.colors.black,
  },
  viewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'transparent',
  },
  viewBtnText: {
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.textSecondary,
    letterSpacing: 1,
  },
});

export default React.memo(AthleteMatchCard);
