import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Shield, ShieldCheck, ShieldPlus } from 'lucide-react-native';

// NOTE: We inline tier metadata here to avoid circular dependency issues during build.
// This matches constants/verification.ts which is the source of truth.
type VerificationTier = 'self_reported' | 'app_measured' | 'coach_verified' | 'center_tested';

const TIER_META: Record<VerificationTier, { color: string; bgColor: string; shortLabel: string }> =
  {
    self_reported: { color: '#8E8E93', bgColor: 'rgba(142,142,147,0.15)', shortLabel: 'Self' },
    app_measured: { color: '#64D2FF', bgColor: 'rgba(100,210,255,0.15)', shortLabel: 'App' },
    coach_verified: { color: '#30D158', bgColor: 'rgba(48,209,88,0.15)', shortLabel: 'Coach' },
    center_tested: { color: '#FFD700', bgColor: 'rgba(255,215,0,0.15)', shortLabel: 'Official' },
  };

interface VerificationBadgeProps {
  tier: VerificationTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  onPress?: () => void;
}

const ICON_SIZES = { sm: 12, md: 16, lg: 20 };
const FONT_SIZES = { sm: 9, md: 11, lg: 13 };

function TierIcon({ tier, size }: { tier: VerificationTier; size: number }) {
  const meta = TIER_META[tier] || TIER_META.self_reported;
  switch (tier) {
    case 'center_tested':
      return <ShieldPlus size={size} color={meta.color} />;
    case 'coach_verified':
    case 'app_measured':
      return <ShieldCheck size={size} color={meta.color} />;
    default:
      return <Shield size={size} color={meta.color} />;
  }
}

export default function VerificationBadge({
  tier,
  size = 'md',
  showLabel = false,
  onPress,
}: VerificationBadgeProps) {
  const meta = TIER_META[tier] || TIER_META.self_reported;
  const iconSize = ICON_SIZES[size];
  const fontSize = FONT_SIZES[size];

  const content = (
    <View style={[styles.badge, { backgroundColor: meta.bgColor }]}>
      <TierIcon tier={tier} size={iconSize} />
      {showLabel && (
        <Text style={[styles.label, { color: meta.color, fontSize }]}>{meta.shortLabel}</Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
