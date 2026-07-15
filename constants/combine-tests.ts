import type { TestType } from '@/constants/fitness-test-data';
import type { FitnessTestResult } from '@/types';

// The four core tests that make up an athlete's Combine — shared between the
// fitness hub scorecard (app/beep-test.tsx) and the public portfolio's
// verified-results strip (app/user/[id].tsx) so labels/formatting can't drift.
export interface CombineTestDef {
  testType: TestType;
  label: string;
  emptyHref: string;
  format: (r: Partial<FitnessTestResult>) => string;
}

export const COMBINE_TESTS: CombineTestDef[] = [
  {
    testType: 'yoyo',
    label: 'YO-YO IR1',
    emptyHref: '/beep-test-live',
    format: (r) => `L${r.level ?? '?'}.${r.shuttle ?? '?'}`,
  },
  {
    testType: 'sprint_20m',
    label: 'SPRINT 20M',
    emptyHref: '/guided-test?testType=sprint_20m',
    format: (r) => (r.sprint_time != null ? `${r.sprint_time.toFixed(2)}s` : '—'),
  },
  {
    testType: 'agility_ttest',
    label: 'AGILITY',
    emptyHref: '/guided-test?testType=agility_ttest',
    format: (r) => (r.agility_time != null ? `${r.agility_time.toFixed(2)}s` : '—'),
  },
  {
    testType: 'vertical_jump',
    label: 'V. JUMP',
    emptyHref: '/guided-test?testType=vertical_jump',
    format: (r) => (r.jump_height != null ? `${r.jump_height}cm` : '—'),
  },
];

export const TIER_RANK = {
  self_reported: 0,
  app_measured: 1,
  coach_verified: 2,
  center_tested: 3,
} as const;

export type TierName = keyof typeof TIER_RANK;
