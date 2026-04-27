import { VerificationTier } from '@/types';

export interface VerificationTierMeta {
  key: VerificationTier;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  bgColor: string;
  order: number;
  scoutConfidenceMultiplier: number;
}

export const VERIFICATION_TIERS: Record<VerificationTier, VerificationTierMeta> = {
  self_reported: {
    key: 'self_reported',
    label: 'Self-Reported',
    shortLabel: 'Self',
    description: 'Entered manually by the athlete',
    color: '#8E8E93',
    bgColor: 'rgba(142,142,147,0.15)',
    order: 0,
    scoutConfidenceMultiplier: 0.7,
  },
  app_measured: {
    key: 'app_measured',
    label: 'App-Tested',
    shortLabel: 'App',
    description: 'Tested using OnlyKrida guided mode with sensor verification',
    color: '#64D2FF',
    bgColor: 'rgba(100,210,255,0.15)',
    order: 1,
    scoutConfidenceMultiplier: 0.85,
  },
  coach_verified: {
    key: 'coach_verified',
    label: 'Coach-Verified',
    shortLabel: 'Coach',
    description: 'Verified by a registered coach on OnlyKrida',
    color: '#30D158',
    bgColor: 'rgba(48,209,88,0.15)',
    order: 2,
    scoutConfidenceMultiplier: 1.0,
  },
  center_tested: {
    key: 'center_tested',
    label: 'Center-Tested',
    shortLabel: 'Official',
    description: 'Tested at a certified sports center or official trial',
    color: '#FFD700',
    bgColor: 'rgba(255,215,0,0.15)',
    order: 3,
    scoutConfidenceMultiplier: 1.1,
  },
};

export const TIER_ORDER: VerificationTier[] = [
  'self_reported',
  'app_measured',
  'coach_verified',
  'center_tested',
];

export function getTierMeta(tier: VerificationTier): VerificationTierMeta {
  return VERIFICATION_TIERS[tier] ?? VERIFICATION_TIERS.self_reported;
}

export function getHighestTier(tiers: VerificationTier[]): VerificationTier {
  if (tiers.length === 0) return 'self_reported';
  return tiers.reduce((highest, current) =>
    VERIFICATION_TIERS[current].order > VERIFICATION_TIERS[highest].order ? current : highest,
  );
}

export function isHigherTier(a: VerificationTier, b: VerificationTier): boolean {
  return VERIFICATION_TIERS[a].order > VERIFICATION_TIERS[b].order;
}

// Single source of truth for deriving the verification tier of a fitness test
// result. Used in both save paths (insert) and fetch backfill (legacy rows
// without a stored tier). Keep all callers using this — duplicating the
// rule on the read side and the write side leads to drift, which leads to
// scout-confidence multipliers being wrong.
//
// Rules (highest precedence first):
// 1. Explicit `verification_tier` provided by caller → use it
// 2. `test_mode === 'coached'` → coach_verified
// 3. `sensor_data` present OR `test_mode === 'self'` → app_measured
// 4. Otherwise (`test_mode === 'manual'`, no sensor) → self_reported
//
// `center_tested` is never derived automatically — it must come in via
// the explicit field, set by an admin/center operator after a verified
// in-person test.
export function deriveVerificationTier(input: {
  explicit?: VerificationTier | null;
  test_mode?: 'self' | 'coached' | 'manual' | null;
  has_sensor_data?: boolean;
}): VerificationTier {
  if (input.explicit) return input.explicit;
  if (input.test_mode === 'coached') return 'coach_verified';
  if (input.has_sensor_data || input.test_mode === 'self') return 'app_measured';
  return 'self_reported';
}
