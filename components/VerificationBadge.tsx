import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Shield, ShieldCheck, ShieldPlus, Eye } from 'lucide-react-native';

// NOTE: We inline tier metadata here to avoid circular dependency issues during build.
// This matches constants/verification.ts which is the source of truth.
type VerificationTier = 'self_reported' | 'app_measured' | 'coach_verified' | 'center_tested';
type VerificationMode = 'remote_video' | 'in_person' | 'sensor_only';

// Derived "display state" — not a stored tier value. The data still upgrades to
// coach_verified (1.0× scout multiplier) when a coach approves via video for
// Speed/Power tests, BUT the badge UI flags the result as video-only so scouts
// see at a glance the verification wasn't in-person. Rationale: 40m sprint
// timing and vertical-jump height are highly fakeable on phone video; Yo-Yo is
// not (continuous shuttle running with audible beep cues).
type DisplayState = VerificationTier | 'video_reviewed';

const TIER_META: Record<DisplayState, { color: string; bgColor: string; shortLabel: string }> = {
  self_reported: { color: '#8E8E93', bgColor: 'rgba(142,142,147,0.15)', shortLabel: 'Self' },
  app_measured: { color: '#64D2FF', bgColor: 'rgba(100,210,255,0.15)', shortLabel: 'App' },
  coach_verified: { color: '#30D158', bgColor: 'rgba(48,209,88,0.15)', shortLabel: 'Coach' },
  center_tested: { color: '#FFD700', bgColor: 'rgba(255,215,0,0.15)', shortLabel: 'Official' },
  video_reviewed: { color: '#FF9F0A', bgColor: 'rgba(255,159,10,0.15)', shortLabel: 'Video' },
};

// Speed/Power tests where video verification is too fakeable to display as
// full coach_verified — even though the underlying tier still upgrades.
const VIDEO_RESTRICTED_TESTS = new Set<string>([
  'sprint_10m',
  'sprint_20m',
  'sprint_30m',
  'sprint_40m',
  'agility_ttest',
  'vertical_jump',
]);

interface VerificationBadgeProps {
  tier: VerificationTier;
  /** Optional verification mode (set on the result row). Used together with
   *  testType to detect video-only Speed/Power verifications and downgrade the
   *  visual to "video_reviewed" — the underlying tier is unchanged. */
  mode?: VerificationMode | null;
  /** Optional test_type from the result row. Required for the video-reviewed
   *  differentiation; without it, the badge falls back to the raw tier. */
  testType?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  onPress?: () => void;
}

const ICON_SIZES = { sm: 12, md: 16, lg: 20 };
const FONT_SIZES = { sm: 9, md: 11, lg: 13 };

function deriveDisplayState(
  tier: VerificationTier,
  mode: VerificationMode | null | undefined,
  testType: string | null | undefined,
): DisplayState {
  if (
    tier === 'coach_verified' &&
    mode === 'remote_video' &&
    testType &&
    VIDEO_RESTRICTED_TESTS.has(testType)
  ) {
    return 'video_reviewed';
  }
  return tier;
}

function TierIcon({ state, size }: { state: DisplayState; size: number }) {
  const meta = TIER_META[state] || TIER_META.self_reported;
  switch (state) {
    case 'center_tested':
      return <ShieldPlus size={size} color={meta.color} />;
    case 'coach_verified':
    case 'app_measured':
      return <ShieldCheck size={size} color={meta.color} />;
    case 'video_reviewed':
      return <Eye size={size} color={meta.color} />;
    default:
      return <Shield size={size} color={meta.color} />;
  }
}

export default function VerificationBadge({
  tier,
  mode,
  testType,
  size = 'md',
  showLabel = false,
  onPress,
}: VerificationBadgeProps) {
  const displayState = deriveDisplayState(tier, mode, testType);
  const meta = TIER_META[displayState] || TIER_META.self_reported;
  const iconSize = ICON_SIZES[size];
  const fontSize = FONT_SIZES[size];

  const content = (
    <View style={[styles.badge, { backgroundColor: meta.bgColor }]}>
      <TierIcon state={displayState} size={iconSize} />
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
