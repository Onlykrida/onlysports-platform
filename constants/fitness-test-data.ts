// ============================================
// FITNESS TEST DATA — Yo-Yo IR1, Sprint, Agility, Vertical Jump
// ============================================

// ── Types ──────────────────────────────────────────────────
// TestType re-exports FitnessTestType from types/index.ts as the single source
// of truth. Schema CHECK constraint in supabase-v15-prereq.sql must match.
import type { FitnessTestType } from '@/types';
export type TestType = FitnessTestType;
export type ZoneName = 'starter' | 'building' | 'rising' | 'strong' | 'elite' | 'unstoppable';
export type Gender = 'male' | 'female';
export type AgeGroup = 'u16' | 'u18' | 'u21' | 'senior';

export interface ZoneDefinition {
  name: ZoneName;
  label: string;
  color: string;
  tagline: string;
  minDistance: number;
  maxDistance: number;
}

export interface SprintResult {
  distance: 20 | 40;
  time: number;
  speed: number;
}

// ── Zone Colors & Taglines ─────────────────────────────────
const ZONE_META: Record<ZoneName, { label: string; color: string; tagline: string }> = {
  starter: { label: 'STARTER', color: '#64D2FF', tagline: 'Every champion started here' },
  building: { label: 'BUILDING', color: '#5E5CE6', tagline: 'Your foundation is growing' },
  rising: { label: 'RISING', color: '#FF9F0A', tagline: "You're on the rise" },
  strong: { label: 'STRONG', color: '#30D158', tagline: 'Solid athletic fitness' },
  elite: { label: 'ELITE', color: '#30D158', tagline: 'Top-tier endurance' },
  unstoppable: { label: 'UNSTOPPABLE', color: '#FFD700', tagline: "You're in rare company" },
};

// Public lookup so discover/profile cards can color-code zone badges without
// hardcoding hex values per zone.
export function getZoneMeta(name: ZoneName): { label: string; color: string; tagline: string } {
  return ZONE_META[name] ?? ZONE_META.starter;
}

// ── Yo-Yo IR1 Level Table ──────────────────────────────────
export const YOYO_LEVELS = [
  { level: 5, speed: 10.0, shuttles: 1, cumulativeShuttles: 1, cumulativeDistance: 40 },
  { level: 9, speed: 12.0, shuttles: 1, cumulativeShuttles: 2, cumulativeDistance: 80 },
  { level: 11, speed: 13.0, shuttles: 1, cumulativeShuttles: 3, cumulativeDistance: 120 },
  { level: 12, speed: 13.0, shuttles: 1, cumulativeShuttles: 4, cumulativeDistance: 160 },
  { level: 13, speed: 13.5, shuttles: 2, cumulativeShuttles: 6, cumulativeDistance: 240 },
  { level: 14, speed: 14.0, shuttles: 3, cumulativeShuttles: 9, cumulativeDistance: 360 },
  { level: 15, speed: 14.5, shuttles: 8, cumulativeShuttles: 19, cumulativeDistance: 760 },
  { level: 16, speed: 15.0, shuttles: 8, cumulativeShuttles: 27, cumulativeDistance: 1080 },
  { level: 17, speed: 15.5, shuttles: 8, cumulativeShuttles: 35, cumulativeDistance: 1400 },
  { level: 18, speed: 16.0, shuttles: 8, cumulativeShuttles: 43, cumulativeDistance: 1720 },
  { level: 19, speed: 16.5, shuttles: 8, cumulativeShuttles: 51, cumulativeDistance: 2040 },
  { level: 20, speed: 17.0, shuttles: 8, cumulativeShuttles: 59, cumulativeDistance: 2360 },
  { level: 21, speed: 17.5, shuttles: 8, cumulativeShuttles: 67, cumulativeDistance: 2680 },
  { level: 22, speed: 18.0, shuttles: 8, cumulativeShuttles: 75, cumulativeDistance: 3000 },
  { level: 23, speed: 19.0, shuttles: 8, cumulativeShuttles: 91, cumulativeDistance: 3640 },
];

// ── Yo-Yo Zone Thresholds (minDistance per zone, by gender & age) ──
// Each array = [starter_max, building_max, rising_max, strong_max, elite_max]
// Anything above elite_max = unstoppable
const YOYO_THRESHOLDS: Record<Gender, Record<AgeGroup, number[]>> = {
  male: {
    senior: [520, 1000, 1480, 1960, 2400],
    u21: [400, 880, 1360, 1840, 2280],
    u18: [280, 760, 1240, 1720, 2160],
    u16: [160, 600, 1080, 1560, 2000],
  },
  female: {
    senior: [320, 640, 960, 1280, 1600],
    u21: [240, 520, 840, 1160, 1480],
    u18: [160, 400, 720, 1040, 1360],
    u16: [120, 320, 600, 920, 1240],
  },
};

const ZONE_ORDER: ZoneName[] = ['starter', 'building', 'rising', 'strong', 'elite', 'unstoppable'];

function buildZoneDefs(thresholds: number[]): ZoneDefinition[] {
  return ZONE_ORDER.map((name, i) => ({
    ...ZONE_META[name],
    name,
    minDistance: i === 0 ? 0 : thresholds[i - 1] + 1,
    maxDistance: i < thresholds.length ? thresholds[i] : 99999,
  }));
}

// Pre-built zone definitions
export const ZONE_DEFINITIONS: Record<Gender, Record<AgeGroup, ZoneDefinition[]>> = {
  male: {
    senior: buildZoneDefs(YOYO_THRESHOLDS.male.senior),
    u21: buildZoneDefs(YOYO_THRESHOLDS.male.u21),
    u18: buildZoneDefs(YOYO_THRESHOLDS.male.u18),
    u16: buildZoneDefs(YOYO_THRESHOLDS.male.u16),
  },
  female: {
    senior: buildZoneDefs(YOYO_THRESHOLDS.female.senior),
    u21: buildZoneDefs(YOYO_THRESHOLDS.female.u21),
    u18: buildZoneDefs(YOYO_THRESHOLDS.female.u18),
    u16: buildZoneDefs(YOYO_THRESHOLDS.female.u16),
  },
};

/** Valid Yo-Yo IR1 levels for UI pickers */
export const VALID_YOYO_LEVELS: number[] = YOYO_LEVELS.map((l) => l.level);

/** Snap to the nearest valid Yo-Yo level */
export function snapToValidLevel(target: number): number {
  if (VALID_YOYO_LEVELS.includes(target)) return target;
  // Find nearest valid level
  let best = VALID_YOYO_LEVELS[0];
  for (const lv of VALID_YOYO_LEVELS) {
    if (Math.abs(lv - target) < Math.abs(best - target)) best = lv;
  }
  return best;
}

/** Get the next valid level above or below */
export function getAdjacentLevel(current: number, direction: 1 | -1): number {
  const idx = VALID_YOYO_LEVELS.indexOf(current);
  if (idx < 0) return snapToValidLevel(current);
  const newIdx = idx + direction;
  if (newIdx < 0) return VALID_YOYO_LEVELS[0];
  if (newIdx >= VALID_YOYO_LEVELS.length) return VALID_YOYO_LEVELS[VALID_YOYO_LEVELS.length - 1];
  return VALID_YOYO_LEVELS[newIdx];
}

// ── Zone Lookup ────────────────────────────────────────────
export function getZone(
  distance: number,
  gender: Gender = 'male',
  ageGroup: AgeGroup = 'senior',
): ZoneDefinition {
  const zones = ZONE_DEFINITIONS[gender]?.[ageGroup] ?? ZONE_DEFINITIONS.male.senior;
  for (let i = zones.length - 1; i >= 0; i--) {
    if (distance >= zones[i].minDistance) return zones[i];
  }
  return zones[0];
}

export function getZoneName(
  distance: number,
  gender: Gender = 'male',
  ageGroup: AgeGroup = 'senior',
): ZoneName {
  return getZone(distance, gender, ageGroup).name;
}

// ── VO2max & Distance ──────────────────────────────────────
export function calculateVO2max(distance: number): number {
  return Math.round((distance * 0.0084 + 36.4) * 10) / 10;
}

export function calculateDistance(level: number, shuttle: number): number {
  let totalDistance = 0;
  let matched = false;
  for (const entry of YOYO_LEVELS) {
    if (entry.level < level) {
      totalDistance = entry.cumulativeDistance;
    } else if (entry.level === level) {
      const prevDistance = YOYO_LEVELS[YOYO_LEVELS.indexOf(entry) - 1]?.cumulativeDistance ?? 0;
      const clampedShuttle = Math.min(shuttle, entry.shuttles);
      totalDistance = prevDistance + clampedShuttle * 40;
      matched = true;
      break;
    } else {
      // Level falls between two YOYO_LEVELS entries (e.g. level 6, 7, 8, 10)
      // Use the previous entry's cumulative distance + shuttle * 40
      const clampedShuttle = Math.min(shuttle, 1); // Unknown level, assume 1 shuttle max
      totalDistance = totalDistance + clampedShuttle * 40;
      matched = true;
      break;
    }
  }
  // If level is beyond all entries, use last cumulative distance
  if (!matched && YOYO_LEVELS.length > 0) {
    totalDistance = YOYO_LEVELS[YOYO_LEVELS.length - 1].cumulativeDistance;
  }
  return totalDistance;
}

export function getMaxShuttlesForLevel(level: number): number {
  const entry = YOYO_LEVELS.find((l) => l.level === level);
  if (entry) return entry.shuttles;
  // For levels between entries (6,7,8,10), return 1 shuttle (they're transition levels)
  return 1;
}

export function getSpeedForLevel(level: number): number {
  const entry = YOYO_LEVELS.find((l) => l.level === level);
  if (entry) return entry.speed;
  // For intermediate levels, interpolate from the nearest lower entry
  for (let i = YOYO_LEVELS.length - 1; i >= 0; i--) {
    if (YOYO_LEVELS[i].level <= level) return YOYO_LEVELS[i].speed;
  }
  return 10;
}

// ── Improvement Tips ───────────────────────────────────────
const YOYO_IMPROVEMENT_TIPS: Record<ZoneName, string[]> = {
  starter: [
    'Start with 3 easy runs per week (20-30 min at a comfortable pace)',
    'Practice the 20m shuttle turn technique — quick, low pivot',
    'Aim to move up a level every 2 weeks',
  ],
  building: [
    'Add one tempo run per week (run at a pace where talking is hard)',
    'Try interval training: 4 x 400m with 90s rest',
    'Focus on breathing rhythm: in for 2 steps, out for 2 steps',
  ],
  rising: [
    'Increase long run to 40+ minutes once a week',
    'Add hill sprints: 6 x 30 seconds uphill with walk-back recovery',
    'Practice Yo-Yo test simulation twice per week',
  ],
  strong: [
    'Introduce 800m-1600m repeats at high intensity',
    'Add plyometric training (box jumps, burpees) for power endurance',
    'Test every 6-8 weeks to track improvement',
  ],
  elite: [
    'Focus on lactate threshold runs (20-30 min at 85% max HR)',
    'Sport-specific conditioning: match the movement patterns of your sport',
    'Recovery is key: 48-72 hours between intense sessions',
  ],
  unstoppable: [
    'Maintain with 2-3 high-intensity sessions per week',
    'Focus on sport-specific performance, not just endurance',
    "You're in professional athlete territory — stay consistent",
  ],
};

export function getImprovementTips(zone: ZoneName): string[] {
  return YOYO_IMPROVEMENT_TIPS[zone] ?? YOYO_IMPROVEMENT_TIPS.starter;
}

// ── Next Zone Target ───────────────────────────────────────
export function getNextZoneTarget(
  distance: number,
  gender: Gender = 'male',
  ageGroup: AgeGroup = 'senior',
): { zone: ZoneDefinition; distanceNeeded: number; shuttlesNeeded: number } | null {
  const currentZone = getZone(distance, gender, ageGroup);
  const zones = ZONE_DEFINITIONS[gender]?.[ageGroup] ?? ZONE_DEFINITIONS.male.senior;
  const currentIdx = zones.findIndex((z) => z.name === currentZone.name);
  if (currentIdx >= zones.length - 1) return null; // already unstoppable
  const nextZone = zones[currentIdx + 1];
  const distanceNeeded = nextZone.minDistance - distance;
  const shuttlesNeeded = Math.ceil(distanceNeeded / 40);
  return { zone: nextZone, distanceNeeded, shuttlesNeeded };
}

// ── Fitness Decay Model ────────────────────────────────────
type ActivityLevel = 'active' | 'moderate' | 'inactive';

const DECAY_LAMBDA: Record<ActivityLevel, number> = {
  active: 0.005,
  moderate: 0.01,
  inactive: 0.02,
};

export function getDecayFactor(
  daysSinceTest: number,
  activityLevel: ActivityLevel = 'moderate',
): number {
  const lambda = DECAY_LAMBDA[activityLevel] ?? DECAY_LAMBDA.moderate;
  return Math.exp(-lambda * daysSinceTest);
}

export function getFreshness(daysSinceTest: number): {
  status: 'fresh' | 'aging' | 'stale';
  color: string;
  label: string;
} {
  if (daysSinceTest <= 42) return { status: 'fresh', color: '#30D158', label: 'Fresh' };
  if (daysSinceTest <= 70)
    return { status: 'aging', color: '#FF9F0A', label: 'Aging — retest recommended' };
  return { status: 'stale', color: '#FF453A', label: 'Stale — retest required' };
}

// ── Endurance Score (0-100) for Scouting Algorithm ─────────
const MAX_DISTANCE = 3640; // max possible Yo-Yo IR1 distance

export function yoyoToEnduranceScore(level: number, shuttle: number): number {
  const distance = calculateDistance(level, shuttle);
  const score = Math.round((distance / MAX_DISTANCE) * 100);
  return Math.min(100, Math.max(0, score));
}

// ── Age Group Helper ───────────────────────────────────────
export function getAgeGroup(dateOfBirth?: string | Date): AgeGroup {
  if (!dateOfBirth) return 'senior';
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  if (age < 16) return 'u16';
  if (age < 18) return 'u18';
  if (age < 21) return 'u21';
  return 'senior';
}

// ============================================
// PHASE 2 TESTS — Sprint, Agility, Vertical Jump
// ============================================

// ── Sprint Zone Thresholds ─────────────────────────────────
// Boundaries: [starter_slower_than, building, rising, strong, elite]
// Anything faster than elite = unstoppable
// Times in seconds (lower is better)
const SPRINT_THRESHOLDS: Record<Gender, Record<AgeGroup, Record<20 | 40, number[]>>> = {
  male: {
    senior: { 20: [3.8, 3.4, 3.1, 2.8, 2.6], 40: [7.0, 6.5, 6.0, 5.5, 5.0] },
    u21: { 20: [3.9, 3.5, 3.2, 2.9, 2.7], 40: [7.2, 6.7, 6.2, 5.7, 5.2] },
    u18: { 20: [4.1, 3.7, 3.4, 3.1, 2.8], 40: [7.5, 7.0, 6.5, 6.0, 5.5] },
    u16: { 20: [4.4, 4.0, 3.6, 3.3, 3.0], 40: [8.0, 7.5, 7.0, 6.5, 5.8] },
  },
  female: {
    senior: { 20: [4.3, 3.9, 3.6, 3.3, 3.1], 40: [7.5, 7.0, 6.5, 6.0, 5.5] },
    u21: { 20: [4.4, 4.0, 3.7, 3.4, 3.2], 40: [7.7, 7.2, 6.7, 6.2, 5.7] },
    u18: { 20: [4.6, 4.2, 3.9, 3.6, 3.3], 40: [8.0, 7.5, 7.0, 6.5, 6.0] },
    u16: { 20: [4.9, 4.5, 4.1, 3.8, 3.5], 40: [8.5, 8.0, 7.5, 7.0, 6.3] },
  },
};

export function getSprintZone(
  time: number,
  distance: 20 | 40,
  gender: Gender = 'male',
  ageGroup: AgeGroup = 'senior',
): ZoneDefinition {
  const thresholds =
    SPRINT_THRESHOLDS[gender]?.[ageGroup]?.[distance] ?? SPRINT_THRESHOLDS.male.senior[distance];
  // Lower time = better (reverse logic)
  if (time >= thresholds[0])
    return { ...ZONE_META.starter, name: 'starter', minDistance: 0, maxDistance: 0 };
  if (time >= thresholds[1])
    return { ...ZONE_META.building, name: 'building', minDistance: 0, maxDistance: 0 };
  if (time >= thresholds[2])
    return { ...ZONE_META.rising, name: 'rising', minDistance: 0, maxDistance: 0 };
  if (time >= thresholds[3])
    return { ...ZONE_META.strong, name: 'strong', minDistance: 0, maxDistance: 0 };
  if (time >= thresholds[4])
    return { ...ZONE_META.elite, name: 'elite', minDistance: 0, maxDistance: 0 };
  return { ...ZONE_META.unstoppable, name: 'unstoppable', minDistance: 0, maxDistance: 0 };
}

export const SPRINT_TIPS: Record<ZoneName, string[]> = {
  starter: [
    'Focus on running form: high knees, pump arms, stay on toes',
    'Practice 3-4 short sprints (20m) with full rest between',
    'Build basic leg strength with squats and lunges',
  ],
  building: [
    'Add resistance band sprints for explosive power',
    'Practice starts: react to a clap or whistle',
    'Do 6 x 30m sprints twice a week with 2-minute rest',
  ],
  rising: [
    'Focus on acceleration phase (first 10m is everything)',
    'Add sled pushes or uphill sprints for power',
    'Film yourself sprinting and analyze your form',
  ],
  strong: [
    'Work on max velocity maintenance (last 10-20m)',
    'Plyometric training: depth jumps, bounding drills',
    'Sprint every 3 days — quality over quantity',
  ],
  elite: [
    'Fine-tune start mechanics with block work or standing starts',
    'Contrast training: heavy squat → immediate sprint',
    'Recovery and flexibility are critical at this level',
  ],
  unstoppable: [
    'Maintain with 2 quality sprint sessions per week',
    'Focus on sport-specific speed application',
    'You have professional-level acceleration',
  ],
};

// ── Agility T-Test Thresholds ──────────────────────────────
// Times in seconds (lower is better)
const AGILITY_THRESHOLDS: Record<Gender, Record<AgeGroup, number[]>> = {
  male: {
    senior: [12.0, 11.0, 10.0, 9.5, 9.0],
    u21: [12.5, 11.5, 10.5, 10.0, 9.5],
    u18: [13.0, 12.0, 11.0, 10.5, 9.8],
    u16: [13.5, 12.5, 11.5, 11.0, 10.2],
  },
  female: {
    senior: [13.5, 12.5, 11.5, 11.0, 10.5],
    u21: [14.0, 13.0, 12.0, 11.5, 11.0],
    u18: [14.5, 13.5, 12.5, 12.0, 11.3],
    u16: [15.0, 14.0, 13.0, 12.5, 11.7],
  },
};

export function getAgilityZone(
  time: number,
  gender: Gender = 'male',
  ageGroup: AgeGroup = 'senior',
): ZoneDefinition {
  const thresholds = AGILITY_THRESHOLDS[gender]?.[ageGroup] ?? AGILITY_THRESHOLDS.male.senior;
  if (time >= thresholds[0])
    return { ...ZONE_META.starter, name: 'starter', minDistance: 0, maxDistance: 0 };
  if (time >= thresholds[1])
    return { ...ZONE_META.building, name: 'building', minDistance: 0, maxDistance: 0 };
  if (time >= thresholds[2])
    return { ...ZONE_META.rising, name: 'rising', minDistance: 0, maxDistance: 0 };
  if (time >= thresholds[3])
    return { ...ZONE_META.strong, name: 'strong', minDistance: 0, maxDistance: 0 };
  if (time >= thresholds[4])
    return { ...ZONE_META.elite, name: 'elite', minDistance: 0, maxDistance: 0 };
  return { ...ZONE_META.unstoppable, name: 'unstoppable', minDistance: 0, maxDistance: 0 };
}

export const AGILITY_TIPS: Record<ZoneName, string[]> = {
  starter: [
    'Practice the T-test cone setup: 10m forward, 5m side, 5m side, 10m back',
    'Work on lateral shuffles — stay low, quick feet',
    'Do ladder drills 3 times per week',
  ],
  building: [
    'Add cone drills with direction changes at speed',
    'Practice deceleration — stopping fast is as important as starting fast',
    'Strengthen ankles with single-leg balance work',
  ],
  rising: [
    'React to visual cues (partner points direction, you move)',
    'Add resistance to lateral movements with bands',
    'Work on hip mobility for quicker direction changes',
  ],
  strong: [
    'Combine agility with sport-specific skills (dribble + change direction)',
    'Train on different surfaces for adaptability',
    'Focus on the transition between movements, not just individual moves',
  ],
  elite: [
    'Refine micro-adjustments in foot placement during cuts',
    'Use video analysis to identify inefficiencies in your movement',
    'Maintain with 2 quality agility sessions per week',
  ],
  unstoppable: [
    'Your agility is elite — maintain and apply to sport-specific scenarios',
    'Focus on reading the game to use your agility at the right moments',
    'Train reaction time alongside agility',
  ],
};

// ── Vertical Jump Thresholds ───────────────────────────────
// Heights in centimeters (higher is better)
const JUMP_THRESHOLDS: Record<Gender, Record<AgeGroup, number[]>> = {
  male: {
    senior: [35, 45, 55, 65, 75],
    u21: [30, 40, 50, 60, 70],
    u18: [25, 35, 45, 55, 65],
    u16: [20, 30, 40, 50, 60],
  },
  female: {
    senior: [20, 30, 40, 50, 60],
    u21: [18, 28, 38, 48, 58],
    u18: [15, 25, 35, 45, 55],
    u16: [12, 22, 32, 42, 52],
  },
};

export function getVerticalJumpZone(
  height: number,
  gender: Gender = 'male',
  ageGroup: AgeGroup = 'senior',
): ZoneDefinition {
  const thresholds = JUMP_THRESHOLDS[gender]?.[ageGroup] ?? JUMP_THRESHOLDS.male.senior;
  // Higher is better
  if (height < thresholds[0])
    return { ...ZONE_META.starter, name: 'starter', minDistance: 0, maxDistance: 0 };
  if (height < thresholds[1])
    return { ...ZONE_META.building, name: 'building', minDistance: 0, maxDistance: 0 };
  if (height < thresholds[2])
    return { ...ZONE_META.rising, name: 'rising', minDistance: 0, maxDistance: 0 };
  if (height < thresholds[3])
    return { ...ZONE_META.strong, name: 'strong', minDistance: 0, maxDistance: 0 };
  if (height < thresholds[4])
    return { ...ZONE_META.elite, name: 'elite', minDistance: 0, maxDistance: 0 };
  return { ...ZONE_META.unstoppable, name: 'unstoppable', minDistance: 0, maxDistance: 0 };
}

export const JUMP_TIPS: Record<ZoneName, string[]> = {
  starter: [
    'Start with bodyweight squats — 3 sets of 15, three times a week',
    'Practice jumping and landing softly on both feet',
    'Build core strength with planks and leg raises',
  ],
  building: [
    'Add box jumps starting at a comfortable height',
    'Do jump squats: 3 sets of 10 with good form',
    'Practice single-leg hops for balance and power',
  ],
  rising: [
    'Add depth jumps: step off a box, land, immediately jump up',
    'Weighted squats and lunges for raw strength',
    'Focus on arm swing — it adds 10-15% to your jump height',
  ],
  strong: [
    'Olympic lifting variations: power cleans, hang cleans',
    'Contrast training: heavy squat set → immediate max jumps',
    'Track your jump height weekly to monitor progress',
  ],
  elite: [
    'Fine-tune takeoff mechanics with video analysis',
    'Tendon stiffness training: pogos, ankle bounces',
    'Periodize your training — peak for testing/competition days',
  ],
  unstoppable: [
    'Maintain explosive power with 2 plyo sessions per week',
    'Apply your power to sport-specific movements',
    'Your vertical is elite — focus on game application',
  ],
};
