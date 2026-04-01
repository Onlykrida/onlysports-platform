# Verified Fitness Testing System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace self-reported-only fitness testing with a 4-tier verification system (Self-Reported → App-Measured → Coach-Verified → Center-Tested) using phone sensors, video proof, and coach attestation — giving scouts trustworthy data while keeping zero barrier for grassroots athletes.

**Architecture:** Add verification_tier + video_url + sensor_data columns to fitness_test_results. Build accelerometer-based turn counting for Yo-Yo and freefall detection for vertical jump. Add video recording during tests. Coach verification via notification flow. Display verification badges (gray/blue/green/gold shields) on all fitness data. Scout search filters by minimum verification tier.

**Tech Stack:** React Native (Expo SDK 54), TypeScript, Supabase (Postgres + Storage + RLS), expo-sensors (Accelerometer), expo-camera (video), expo-av (audio), existing fitness-test-context + scouting-context hooks.

---

## File Structure

### New Files

| File                               | Responsibility                                                                                     |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| `constants/verification.ts`        | VerificationTier type, badge colors, tier metadata, shield component config                        |
| `hooks/sensor-context.tsx`         | Accelerometer service: start/stop recording, turn detection, freefall detection, anti-cheat checks |
| `components/VerificationBadge.tsx` | Reusable shield badge component (gray/blue/green/gold) with tooltip                                |
| `components/VideoProofCapture.tsx` | Camera overlay for recording test video proof                                                      |
| `components/CoachVerifyCard.tsx`   | Card shown to coaches for one-tap verification of athlete results                                  |
| `app/verify-result.tsx`            | Screen for coach to review & verify an athlete's test result                                       |

### Modified Files

| File                                         | Changes                                                                                                   |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `types/index.ts`                             | Add VerificationTier type, update FitnessTestResult interface, add TestAttestation type                   |
| `supabase-fitness-tests.sql`                 | Add verification columns, test_attestations table, verification_requests table                            |
| `hooks/fitness-test-context.tsx`             | Update save methods to accept verification_tier + sensor_data + video_url, add requestCoachVerification() |
| `hooks/scouting-context.tsx`                 | Update computeFit() with verification confidence multiplier, add scout filter by tier                     |
| `constants/fitness-test-data.ts`             | Add sensor validation helpers (turn detection thresholds, freefall detection params)                      |
| `components/BeepTestCard.tsx`                | Display VerificationBadge next to every fitness result, pass verification props                           |
| `app/beep-test-live.tsx`                     | Integrate accelerometer recording during live Yo-Yo test, count turns, save sensor_data                   |
| `app/beep-test-results.tsx`                  | Add video upload option, show verification tier, "Get Coach Verified" CTA                                 |
| `app/beep-test-manual.tsx`                   | Mark manual entries as self_reported, add optional video attachment                                       |
| `app/beep-test.tsx`                          | Update entry screen to show verification tiers explanation                                                |
| `app/user/[id].tsx`                          | Show verification badges on fitness section, fix gender/ageGroup props                                    |
| `app/(tabs)/profile.tsx`                     | Show verification badges, fix gender/ageGroup props, replace hardcoded stats                              |
| `app/(tabs)/discover.tsx`                    | Add "Minimum Verification" filter for scouts                                                              |
| `components/home/AthleteHome.tsx`            | Replace hardcoded random stats with real data, add verification progress nudge                            |
| `components/home/ScoutHome.tsx`              | Show verification tier on AthleteMatchCard                                                                |
| `components/home/scout/AthleteMatchCard.tsx` | Add verification badge next to fit score                                                                  |
| `app.json`                                   | Add HIGH_SAMPLING_RATE_SENSORS, RECORD_AUDIO permissions                                                  |
| `app/notifications.tsx`                      | Handle coach_verification_request notification type                                                       |

---

## Task 1: Database Migration — Verification Schema

**Files:**

- Modify: `/Users/anirudhtumuluru/onlysports-platform/supabase-fitness-tests.sql`

- [ ] **Step 1: Write the migration SQL**

Add to `supabase-fitness-tests.sql`:

```sql
-- ============================================
-- VERIFICATION SYSTEM MIGRATION
-- ============================================

-- 1. Add verification columns to fitness_test_results
ALTER TABLE public.fitness_test_results
  ADD COLUMN IF NOT EXISTS verification_tier text NOT NULL DEFAULT 'self_reported'
    CHECK (verification_tier IN ('self_reported', 'app_measured', 'coach_verified', 'center_tested')),
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_notes text,
  ADD COLUMN IF NOT EXISTS sensor_data jsonb,
  ADD COLUMN IF NOT EXISTS attestation_count integer DEFAULT 0;

-- 2. Index for verification tier filtering
CREATE INDEX IF NOT EXISTS idx_fitness_test_verification
  ON public.fitness_test_results(verification_tier);

-- 3. Peer attestation table
CREATE TABLE IF NOT EXISTS public.test_attestations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_result_id uuid NOT NULL REFERENCES public.fitness_test_results(id) ON DELETE CASCADE,
  attester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  relationship text CHECK (relationship IN ('teammate', 'training_partner', 'coach_staff', 'spectator')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(test_result_id, attester_id)
);

ALTER TABLE public.test_attestations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attestations_read" ON public.test_attestations FOR SELECT USING (true);
CREATE POLICY "attestations_insert" ON public.test_attestations FOR INSERT WITH CHECK (auth.uid() = attester_id);
CREATE POLICY "attestations_delete" ON public.test_attestations FOR DELETE USING (auth.uid() = attester_id);

-- 4. Coach verification requests table
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_result_id uuid NOT NULL REFERENCES public.fitness_test_results(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES public.profiles(id),
  coach_id uuid NOT NULL REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  coach_notes text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vr_read" ON public.verification_requests FOR SELECT
  USING (auth.uid() = athlete_id OR auth.uid() = coach_id);
CREATE POLICY "vr_insert" ON public.verification_requests FOR INSERT
  WITH CHECK (auth.uid() = athlete_id);
CREATE POLICY "vr_update" ON public.verification_requests FOR UPDATE
  USING (auth.uid() = coach_id);

CREATE INDEX IF NOT EXISTS idx_vr_coach ON public.verification_requests(coach_id, status);
CREATE INDEX IF NOT EXISTS idx_vr_athlete ON public.verification_requests(athlete_id);

-- 5. Supabase Storage bucket for test videos
-- Run via Supabase dashboard or API: create bucket 'test-videos' (public read)
```

- [ ] **Step 2: Apply migration to Supabase**

Run via Supabase SQL Editor or CLI:

```bash
# Copy the SQL above and execute in Supabase Dashboard > SQL Editor
# Or if using Supabase CLI:
# supabase db push
```

- [ ] **Step 3: Create test-videos storage bucket**

In Supabase Dashboard > Storage:

- Create bucket: `test-videos`
- Set public: true
- File size limit: 50MB
- Allowed MIME types: `video/mp4, video/quicktime, video/webm`

- [ ] **Step 4: Verify migration**

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'fitness_test_results'
  AND column_name IN ('verification_tier', 'video_url', 'verified_by', 'sensor_data', 'attestation_count');
-- Should return 5 rows

SELECT tablename FROM pg_tables WHERE tablename IN ('test_attestations', 'verification_requests');
-- Should return 2 rows
```

- [ ] **Step 5: Commit**

```bash
git add supabase-fitness-tests.sql
git commit -m "feat: add verification tier schema — 4-tier trust system for fitness tests"
```

---

## Task 2: Types & Constants — Verification Tier System

**Files:**

- Modify: `/Users/anirudhtumuluru/onlysports-platform/types/index.ts`
- Create: `/Users/anirudhtumuluru/onlysports-platform/constants/verification.ts`

- [ ] **Step 1: Update types/index.ts — add VerificationTier and update FitnessTestResult**

In `types/index.ts`, add after the `FitnessZone` type (around line 8):

```typescript
export type VerificationTier =
  | 'self_reported'
  | 'app_measured'
  | 'coach_verified'
  | 'center_tested';
```

Update the `FitnessTestResult` interface — add these fields after `updated_at`:

```typescript
  // Verification
  verification_tier: VerificationTier;
  video_url?: string;
  verified_by?: string;
  verified_at?: string;
  verification_notes?: string;
  sensor_data?: Record<string, any>;
  attestation_count?: number;
```

Add a new interface after FitnessTestResult:

```typescript
export interface TestAttestation {
  id: string;
  test_result_id: string;
  attester_id: string;
  relationship: 'teammate' | 'training_partner' | 'coach_staff' | 'spectator';
  created_at: string;
}

export interface VerificationRequest {
  id: string;
  test_result_id: string;
  athlete_id: string;
  coach_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  coach_notes?: string;
  created_at: string;
  resolved_at?: string;
}
```

- [ ] **Step 2: Create constants/verification.ts**

```typescript
import { VerificationTier } from '@/types';

export interface VerificationTierMeta {
  key: VerificationTier;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  bgColor: string;
  iconName: 'shield' | 'shield-check' | 'shield-plus' | 'shield-star';
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
    iconName: 'shield',
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
    iconName: 'shield-check',
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
    iconName: 'shield-check',
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
    iconName: 'shield-star',
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
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/anirudhtumuluru/onlysports-platform && npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add types/index.ts constants/verification.ts
git commit -m "feat: add verification tier types and constants — 4-tier trust system"
```

---

## Task 3: Verification Badge Component

**Files:**

- Create: `/Users/anirudhtumuluru/onlysports-platform/components/VerificationBadge.tsx`

- [ ] **Step 1: Create the VerificationBadge component**

```typescript
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Shield, ShieldCheck, ShieldPlus, ShieldAlert } from 'lucide-react-native';
import { VerificationTier } from '@/types';
import { getTierMeta } from '@/constants/verification';
import { theme } from '@/constants/theme';

interface VerificationBadgeProps {
  tier: VerificationTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showTooltip?: boolean;
  onPress?: () => void;
}

const ICON_SIZES = { sm: 12, md: 16, lg: 20 };
const FONT_SIZES = { sm: 9, md: 11, lg: 13 };

function TierIcon({ tier, size }: { tier: VerificationTier; size: number }) {
  const meta = getTierMeta(tier);
  const props = { size, color: meta.color };
  switch (tier) {
    case 'center_tested': return <ShieldPlus {...props} />;
    case 'coach_verified': return <ShieldCheck {...props} />;
    case 'app_measured': return <ShieldCheck {...props} />;
    default: return <Shield {...props} />;
  }
}

export default function VerificationBadge({ tier, size = 'md', showLabel = false, onPress }: VerificationBadgeProps) {
  const meta = getTierMeta(tier);
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
    return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>;
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/anirudhtumuluru/onlysports-platform && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/VerificationBadge.tsx
git commit -m "feat: add VerificationBadge component — shield badges for 4 trust tiers"
```

---

## Task 4: Sensor Service — Accelerometer Turn Detection & Freefall

**Files:**

- Create: `/Users/anirudhtumuluru/onlysports-platform/hooks/sensor-context.tsx`
- Modify: `/Users/anirudhtumuluru/onlysports-platform/app.json`

- [ ] **Step 1: Install expo-sensors**

```bash
cd /Users/anirudhtumuluru/onlysports-platform && npx expo install expo-sensors
```

- [ ] **Step 2: Update app.json permissions**

In `app.json`, add to the android.permissions array:

```json
"HIGH_SAMPLING_RATE_SENSORS",
"RECORD_AUDIO",
"ACCESS_FINE_LOCATION"
```

- [ ] **Step 3: Create hooks/sensor-context.tsx**

```typescript
import { useRef, useCallback } from 'react';
import { Accelerometer, AccelerometerMeasurement } from 'expo-sensors';

interface SensorReading {
  timestamp: number;
  x: number;
  y: number;
  z: number;
  magnitude: number;
}

interface TurnEvent {
  timestamp: number;
  index: number;
}

interface FreefallEvent {
  startTimestamp: number;
  endTimestamp: number;
  durationMs: number;
}

interface SensorSession {
  readings: SensorReading[];
  turns: TurnEvent[];
  freefalls: FreefallEvent[];
  startTime: number;
  endTime: number;
}

// Thresholds tuned for running turns (Yo-Yo shuttle)
const TURN_DECEL_THRESHOLD = 14.0; // m/s^2 magnitude spike at turn
const TURN_DEBOUNCE_MS = 1500; // Min time between turns (~3s for fastest Yo-Yo level)
const FREEFALL_THRESHOLD = 2.0; // m/s^2 — below this = freefall (gravity ~9.8 normally)
const FREEFALL_MIN_MS = 100; // Min freefall duration to count as jump
const SAMPLING_INTERVAL_MS = 20; // 50Hz — works on budget phones

export function useSensorRecording() {
  const subscription = useRef<any>(null);
  const session = useRef<SensorSession>({
    readings: [],
    turns: [],
    freefalls: [],
    startTime: 0,
    endTime: 0,
  });
  const lastTurnTime = useRef(0);
  const inFreefall = useRef(false);
  const freefallStart = useRef(0);

  const processReading = useCallback((data: AccelerometerMeasurement) => {
    const now = Date.now();
    const magnitude = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2) * 9.81; // Convert to m/s^2

    const reading: SensorReading = {
      timestamp: now,
      x: data.x * 9.81,
      y: data.y * 9.81,
      z: data.z * 9.81,
      magnitude,
    };
    session.current.readings.push(reading);

    // Turn detection: spike in magnitude above threshold
    if (magnitude > TURN_DECEL_THRESHOLD && now - lastTurnTime.current > TURN_DEBOUNCE_MS) {
      lastTurnTime.current = now;
      session.current.turns.push({
        timestamp: now,
        index: session.current.turns.length,
      });
    }

    // Freefall detection: magnitude drops near zero (phone in freefall)
    if (magnitude < FREEFALL_THRESHOLD) {
      if (!inFreefall.current) {
        inFreefall.current = true;
        freefallStart.current = now;
      }
    } else {
      if (inFreefall.current) {
        const duration = now - freefallStart.current;
        if (duration >= FREEFALL_MIN_MS) {
          session.current.freefalls.push({
            startTimestamp: freefallStart.current,
            endTimestamp: now,
            durationMs: duration,
          });
        }
        inFreefall.current = false;
      }
    }
  }, []);

  const startRecording = useCallback(async () => {
    session.current = {
      readings: [],
      turns: [],
      freefalls: [],
      startTime: Date.now(),
      endTime: 0,
    };
    lastTurnTime.current = 0;
    inFreefall.current = false;

    Accelerometer.setUpdateInterval(SAMPLING_INTERVAL_MS);
    subscription.current = Accelerometer.addListener(processReading);
  }, [processReading]);

  const stopRecording = useCallback((): SensorSession => {
    subscription.current?.remove();
    subscription.current = null;
    session.current.endTime = Date.now();
    return { ...session.current };
  }, []);

  const getTurnCount = useCallback(() => session.current.turns.length, []);

  const getLastFreefall = useCallback((): FreefallEvent | null => {
    const ff = session.current.freefalls;
    return ff.length > 0 ? ff[ff.length - 1] : null;
  }, []);

  // Calculate jump height from freefall duration: h = g * t^2 / 8
  const calculateJumpHeight = useCallback((freefallMs: number): number => {
    const t = freefallMs / 1000;
    return ((9.81 * t * t) / 8) * 100; // Convert to cm
  }, []);

  // Anti-cheat: check if movement pattern looks like running vs car/shaking
  const validateMovementPattern = useCallback(
    (
      readings: SensorReading[],
    ): {
      isLikelyRunning: boolean;
      dominantFrequencyHz: number;
      confidence: number;
    } => {
      if (readings.length < 100)
        return { isLikelyRunning: false, dominantFrequencyHz: 0, confidence: 0 };

      // Simple stride frequency estimation via zero-crossing rate
      const magnitudes = readings.map((r) => r.magnitude);
      const mean = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;

      let crossings = 0;
      for (let i = 1; i < magnitudes.length; i++) {
        if (magnitudes[i] > mean !== magnitudes[i - 1] > mean) {
          crossings++;
        }
      }

      const durationSec = (readings[readings.length - 1].timestamp - readings[0].timestamp) / 1000;
      const frequencyHz = crossings / (2 * durationSec); // Half crossings = full cycles

      // Running: 2-4 Hz stride frequency
      // Walking: 1-2 Hz
      // Car: < 0.5 Hz (smooth)
      // Shaking: > 5 Hz
      const isLikelyRunning = frequencyHz >= 1.5 && frequencyHz <= 5.0;
      const confidence = isLikelyRunning ? Math.min(1, durationSec / 30) : 0.2;

      return { isLikelyRunning, dominantFrequencyHz: frequencyHz, confidence };
    },
    [],
  );

  // Create summary for sensor_data JSON field
  const getSensorSummary = useCallback((): Record<string, any> => {
    const s = session.current;
    const validation = validateMovementPattern(s.readings);
    return {
      duration_ms: s.endTime - s.startTime,
      total_readings: s.readings.length,
      sampling_rate_hz: s.readings.length / ((s.endTime - s.startTime) / 1000),
      turns_detected: s.turns.length,
      freefalls_detected: s.freefalls.length,
      movement_validation: validation,
      turn_timestamps: s.turns.map((t) => t.timestamp - s.startTime), // Relative timestamps
    };
  }, [validateMovementPattern]);

  return {
    startRecording,
    stopRecording,
    getTurnCount,
    getLastFreefall,
    calculateJumpHeight,
    validateMovementPattern,
    getSensorSummary,
  };
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/anirudhtumuluru/onlysports-platform && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add hooks/sensor-context.tsx app.json
git commit -m "feat: add accelerometer sensor service — turn detection, freefall, anti-cheat"
```

---

## Task 5: Update Fitness Test Context — Verification-Aware Save Methods

**Files:**

- Modify: `/Users/anirudhtumuluru/onlysports-platform/hooks/fitness-test-context.tsx`

- [ ] **Step 1: Update save method signatures to accept verification fields**

In `fitness-test-context.tsx`, update the `saveYoYoResult` function parameter type (around line 252). Add to the data parameter:

```typescript
verification_tier?: VerificationTier;
video_url?: string;
sensor_data?: Record<string, any>;
```

Do the same for `saveSprintResult`, `saveAgilityResult`, `saveJumpResult`, and `saveBatchYoYoResults`.

- [ ] **Step 2: Update the insert calls to include verification fields**

In each save function, add the verification fields to the Supabase insert object. Example for saveYoYoResult (around line 275):

Before:

```typescript
const { error } = await supabase.from('fitness_test_results').insert({
  athlete_id: data.athlete_id,
  conducted_by: data.conducted_by,
  test_type: 'yoyo',
  test_mode: data.test_mode,
  // ... existing fields
});
```

After — add these fields:

```typescript
verification_tier: data.verification_tier || (data.test_mode === 'coached' ? 'coach_verified' : data.sensor_data ? 'app_measured' : 'self_reported'),
video_url: data.video_url || null,
sensor_data: data.sensor_data || null,
verified_by: data.conducted_by || null,
verified_at: data.conducted_by ? new Date().toISOString() : null,
```

Apply the same pattern to all 4 save methods. For `saveBatchYoYoResults`, each batch item gets `verification_tier: 'coach_verified'` and `verified_by: conducted_by`.

- [ ] **Step 3: Add requestCoachVerification function**

Add after the existing save methods:

```typescript
const requestCoachVerification = useCallback(
  async (testResultId: string, coachId: string): Promise<{ error?: string }> => {
    if (!currentUser) return { error: 'Not authenticated' };
    try {
      const { error } = await supabase.from('verification_requests').insert({
        test_result_id: testResultId,
        athlete_id: currentUser.id,
        coach_id: coachId,
        status: 'pending',
      });
      if (error) return { error: error.message };

      // Send notification to coach
      // (handled by notification context in the calling component)
      return {};
    } catch (e: any) {
      return { error: e.message };
    }
  },
  [currentUser],
);

const approveVerification = useCallback(
  async (requestId: string, testResultId: string, notes?: string): Promise<{ error?: string }> => {
    if (!currentUser) return { error: 'Not authenticated' };
    try {
      // Update verification request
      const { error: reqError } = await supabase
        .from('verification_requests')
        .update({ status: 'approved', coach_notes: notes, resolved_at: new Date().toISOString() })
        .eq('id', requestId);
      if (reqError) return { error: reqError.message };

      // Upgrade the test result verification tier
      const { error: testError } = await supabase
        .from('fitness_test_results')
        .update({
          verification_tier: 'coach_verified',
          verified_by: currentUser.id,
          verified_at: new Date().toISOString(),
          verification_notes: notes,
        })
        .eq('id', testResultId);
      if (testError) return { error: testError.message };

      await refreshHistory();
      return {};
    } catch (e: any) {
      return { error: e.message };
    }
  },
  [currentUser, refreshHistory],
);
```

Add `requestCoachVerification` and `approveVerification` to the context value.

- [ ] **Step 4: Update fetch methods to include verification fields**

In `fetchLatestForAthlete` and `fetchHistoryForAthlete`, add `verification_tier, video_url, verified_by, verified_at, sensor_data, attestation_count` to the select string (currently selects `*` so this may already work, but verify).

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /Users/anirudhtumuluru/onlysports-platform && npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add hooks/fitness-test-context.tsx
git commit -m "feat: update fitness context with verification-aware save methods + coach verification flow"
```

---

## Task 6: Integrate Sensors into Live Yo-Yo Test

**Files:**

- Modify: `/Users/anirudhtumuluru/onlysports-platform/app/beep-test-live.tsx`

- [ ] **Step 1: Import and initialize sensor recording**

At the top of the file, add:

```typescript
import { useSensorRecording } from '@/hooks/sensor-context';
```

Inside the component, add after existing state:

```typescript
const { startRecording, stopRecording, getTurnCount, getSensorSummary } = useSensorRecording();
const [sensorTurnCount, setSensorTurnCount] = useState(0);
```

- [ ] **Step 2: Start sensor recording when test begins**

In the `startTest()` function (around line 219), add at the beginning:

```typescript
await startRecording();
```

- [ ] **Step 3: Update turn count display during test**

In the `advanceShuttle()` function (around line 142), add after the shuttle/level logic:

```typescript
setSensorTurnCount(getTurnCount());
```

- [ ] **Step 4: Stop sensors and pass data to results screen**

In the `stopHere()` function (around line 279), before the `router.push`:

```typescript
const sensorData = stopRecording();
const sensorSummary = getSensorSummary();
```

Update the navigation params:

```typescript
router.push({
  pathname: '/beep-test-results',
  params: {
    level: currentLevelRef.current.toString(),
    shuttle: currentShuttleRef.current.toString(),
    mode: 'self',
    testType: 'yoyo',
    sensorData: JSON.stringify(sensorSummary),
    sensorTurns: sensorSummary.turns_detected.toString(),
  },
});
```

Do the same in the `finishTest()` function if it navigates to results.

- [ ] **Step 5: Show sensor turn count in the running UI**

In the test-running UI section, add a small indicator showing sensor-detected turns vs expected turns. Find the stats display area and add:

```tsx
<View style={styles.sensorIndicator}>
  <Text style={styles.sensorLabel}>Turns Detected</Text>
  <Text style={styles.sensorValue}>
    {sensorTurnCount} / {(currentShuttle - 1) * 2 + (currentLevel > startLevel ? '...' : '')}
  </Text>
</View>
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd /Users/anirudhtumuluru/onlysports-platform && npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add app/beep-test-live.tsx
git commit -m "feat: integrate accelerometer during live Yo-Yo test — turn counting + sensor data capture"
```

---

## Task 7: Update Results Screen — Verification Tier + Video Upload + Coach CTA

**Files:**

- Modify: `/Users/anirudhtumuluru/onlysports-platform/app/beep-test-results.tsx`

- [ ] **Step 1: Parse sensor data from navigation params**

In the params parsing section (around line 90), add:

```typescript
const sensorDataParam = params.sensorData ? JSON.parse(params.sensorData as string) : null;
const sensorTurns = params.sensorTurns ? parseInt(params.sensorTurns as string, 10) : 0;
```

- [ ] **Step 2: Determine verification tier based on test mode and sensor data**

```typescript
const verificationTier: VerificationTier = (() => {
  if (testMode === 'coached') return 'coach_verified';
  if (sensorDataParam && sensorDataParam.movement_validation?.isLikelyRunning)
    return 'app_measured';
  if (testMode === 'self' && sensorDataParam) return 'app_measured'; // Used guided mode with sensors
  return 'self_reported';
})();
```

- [ ] **Step 3: Pass verification fields to save functions**

Update `handleSaveSolo()` — add to the save call:

```typescript
verification_tier: verificationTier,
sensor_data: sensorDataParam,
video_url: videoUrl, // from video capture state (added in next step)
```

- [ ] **Step 4: Add video recording state and upload**

Add state:

```typescript
const [videoUrl, setVideoUrl] = useState<string | null>(null);
const [isUploadingVideo, setIsUploadingVideo] = useState(false);
```

Add video upload function:

```typescript
const handleVideoUpload = async () => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.7,
      videoMaxDuration: 60,
    });
    if (result.canceled) return;

    setIsUploadingVideo(true);
    const asset = result.assets[0];
    const fileName = `${user?.id}/${Date.now()}.mp4`;

    const response = await fetch(asset.uri);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from('test-videos')
      .upload(fileName, blob, { contentType: 'video/mp4' });

    if (error) {
      Alert.alert('Upload Failed', error.message);
    } else {
      const { data: urlData } = supabase.storage.from('test-videos').getPublicUrl(fileName);
      setVideoUrl(urlData.publicUrl);
    }
  } catch (e: any) {
    Alert.alert('Error', 'Failed to upload video');
  } finally {
    setIsUploadingVideo(false);
  }
};
```

- [ ] **Step 5: Add verification badge and video upload UI**

After the zone display section and before the save button, add:

```tsx
{
  /* Verification Tier */
}
<View style={styles.verificationSection}>
  <VerificationBadge tier={verificationTier} size="lg" showLabel />
  <Text style={styles.verificationDesc}>{getTierMeta(verificationTier).description}</Text>
</View>;

{
  /* Video Proof */
}
{
  !videoUrl ? (
    <TouchableOpacity
      style={styles.videoUploadBtn}
      onPress={handleVideoUpload}
      disabled={isUploadingVideo}
    >
      <Camera size={20} color={theme.colors.primary} />
      <Text style={styles.videoUploadText}>
        {isUploadingVideo ? 'Uploading...' : 'Add Video Proof'}
      </Text>
      <Text style={styles.videoUploadHint}>Upgrades your verification badge</Text>
    </TouchableOpacity>
  ) : (
    <View style={styles.videoAttached}>
      <CheckCircle size={16} color={theme.colors.success} />
      <Text style={styles.videoAttachedText}>Video proof attached</Text>
    </View>
  );
}

{
  /* Get Coach Verified CTA */
}
{
  verificationTier !== 'coach_verified' && verificationTier !== 'center_tested' && (
    <View style={styles.coachVerifyCta}>
      <Text style={styles.coachVerifyTitle}>Want higher trust?</Text>
      <Text style={styles.coachVerifyDesc}>
        Coach-Verified athletes get 5x more scout attention
      </Text>
      <Text style={styles.coachVerifyHint}>
        After saving, invite your coach to verify this result
      </Text>
    </View>
  );
}
```

- [ ] **Step 6: Add required imports**

```typescript
import { Camera, CheckCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import VerificationBadge from '@/components/VerificationBadge';
import { getTierMeta } from '@/constants/verification';
import { VerificationTier } from '@/types';
```

- [ ] **Step 7: Add styles for new sections**

```typescript
verificationSection: { alignItems: 'center', paddingVertical: theme.spacing.md, gap: 8 },
verificationDesc: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, textAlign: 'center' },
videoUploadBtn: { flexDirection: 'column', alignItems: 'center', padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border, borderStyle: 'dashed', borderRadius: 12, gap: 6, marginVertical: theme.spacing.md },
videoUploadText: { fontSize: theme.fontSize.md, color: theme.colors.primary, fontWeight: '600' },
videoUploadHint: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
videoAttached: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: theme.spacing.md, backgroundColor: 'rgba(48,209,88,0.1)', borderRadius: 10 },
videoAttachedText: { fontSize: theme.fontSize.sm, color: theme.colors.success, fontWeight: '600' },
coachVerifyCta: { padding: theme.spacing.md, backgroundColor: 'rgba(100,210,255,0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(100,210,255,0.2)', marginVertical: theme.spacing.md, gap: 4 },
coachVerifyTitle: { fontSize: theme.fontSize.md, color: '#64D2FF', fontWeight: '700' },
coachVerifyDesc: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
coachVerifyHint: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 4 },
```

- [ ] **Step 8: Verify TypeScript compiles**

```bash
cd /Users/anirudhtumuluru/onlysports-platform && npx tsc --noEmit
```

- [ ] **Step 9: Commit**

```bash
git add app/beep-test-results.tsx
git commit -m "feat: show verification tier on results, video proof upload, coach verification CTA"
```

---

## Task 8: Display Verification Badges on Profile Pages

**Files:**

- Modify: `/Users/anirudhtumuluru/onlysports-platform/components/BeepTestCard.tsx`
- Modify: `/Users/anirudhtumuluru/onlysports-platform/app/user/[id].tsx`
- Modify: `/Users/anirudhtumuluru/onlysports-platform/app/(tabs)/profile.tsx`

- [ ] **Step 1: Update BeepTestCard to show verification badges**

In `components/BeepTestCard.tsx`, import:

```typescript
import VerificationBadge from '@/components/VerificationBadge';
```

In the `TestResultRow` component (around line 183), after the zone badge, add:

```tsx
{
  result.verification_tier && <VerificationBadge tier={result.verification_tier} size="sm" />;
}
```

In the `AthleteVariant` featured result section (around line 250), after the zone display, add:

```tsx
<VerificationBadge tier={featured.verification_tier || 'self_reported'} size="md" showLabel />
```

In the `ScoutVariant` (around line 440), for each test result row, add the badge:

```tsx
<VerificationBadge tier={result.verification_tier || 'self_reported'} size="sm" showLabel />
```

- [ ] **Step 2: Fix gender/ageGroup props on profile.tsx**

In `app/(tabs)/profile.tsx`, find the FitnessTestCard rendering (around line 585). Update to pass gender and ageGroup:

```tsx
<FitnessTestCard
  variant={Object.keys(latestByType).length > 0 ? 'athlete' : 'empty'}
  latestByType={latestByType}
  history={fitnessTestHistory}
  gender={(user?.roleSpecificData as any)?.gender || 'male'}
  ageGroup={getAgeGroup((user?.roleSpecificData as any)?.dateOfBirth)}
  onTakeTest={() => router.push('/beep-test' as any)}
  onViewHistory={() =>
    router.push({
      pathname: '/beep-test-history' as any,
      params: { athleteId: user.id, athleteName: user.name },
    })
  }
/>
```

Add import at top:

```typescript
import { getAgeGroup } from '@/constants/fitness-test-data';
```

- [ ] **Step 3: Fix gender/ageGroup props on user/[id].tsx**

In `app/user/[id].tsx`, find the FitnessTestCard rendering (around line 775). Update:

```tsx
<FitnessTestCard
  variant="scout"
  latestByType={fitnessLatestByType}
  history={fitnessTestHistory}
  gender={(profileUser?.roleSpecificData as any)?.gender || 'male'}
  ageGroup={getAgeGroup((profileUser?.roleSpecificData as any)?.dateOfBirth)}
  onViewHistory={() =>
    router.push({
      pathname: '/beep-test-history' as any,
      params: { athleteId: profileUser.id, athleteName: profileUser.name },
    })
  }
/>
```

Add import:

```typescript
import { getAgeGroup } from '@/constants/fitness-test-data';
```

- [ ] **Step 4: Replace hardcoded random stats in AthleteHome.tsx**

In `components/home/AthleteHome.tsx`, replace the hardcoded random stats (around line 128-130):

Before:

```typescript
const profileViews = useMemo(() => Math.floor(Math.random() * 50) + 10, []);
const highlightViews = useMemo(() => Math.floor(Math.random() * 200) + 50, []);
```

After:

```typescript
const [profileViews, setProfileViews] = useState(0);
useEffect(() => {
  if (!user?.id || !isSupabaseConfigured) return;
  supabase
    .from('profile_views')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', user.id)
    .then(({ count }) => setProfileViews(count ?? 0));
}, [user?.id]);

const highlightViews = useMemo(() => {
  // Sum likes across user's posts as a proxy for highlight engagement
  return posts
    .filter((p) => p.userId === user?.id)
    .reduce((sum, p) => sum + (p.likes?.length ?? 0), 0);
}, [posts, user?.id]);
```

Add imports if not present:

```typescript
import { supabase, isSupabaseConfigured } from '@/constants/supabase';
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /Users/anirudhtumuluru/onlysports-platform && npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add components/BeepTestCard.tsx app/user/[id].tsx "app/(tabs)/profile.tsx" components/home/AthleteHome.tsx
git commit -m "feat: verification badges on profiles, fix gender/ageGroup, real profile stats"
```

---

## Task 9: Update Scouting Algorithm — Verification Confidence Multiplier

**Files:**

- Modify: `/Users/anirudhtumuluru/onlysports-platform/hooks/scouting-context.tsx`

- [ ] **Step 1: Import verification constants**

```typescript
import { VERIFICATION_TIERS } from '@/constants/verification';
import { VerificationTier } from '@/types';
```

- [ ] **Step 2: Update computeFit() with verification confidence multiplier**

In the `computeFit()` function (around line 246), after calculating the raw fit score, apply the verification multiplier:

Find where the final score is computed (around line 264):

```typescript
const rawTotal =
  (skill * w.skill +
    speed * w.speed +
    stamina * w.stamina +
    posMatch * w.position +
    endurance * w.endurance) /
  sumWeights;
```

After this line, add:

```typescript
// Apply verification confidence multiplier
const verificationTier: VerificationTier = playerData.verification_tier || 'self_reported';
const confidenceMultiplier = VERIFICATION_TIERS[verificationTier]?.scoutConfidenceMultiplier ?? 0.7;
const total = rawTotal * confidenceMultiplier;
```

Change the return to use `total` instead of `rawTotal` (or whatever variable name is used for the final score).

- [ ] **Step 3: Pass verification_tier through the computation pipeline**

In the `computeForScout()` function (around line 343), when fetching player data, also fetch the highest verification tier from their fitness test results:

After the batch Yo-Yo fetch (around line 380), add:

```typescript
// Get highest verification tier for each player
const { data: verificationData } = await supabase
  .from('fitness_test_results')
  .select('athlete_id, verification_tier')
  .in('athlete_id', playerIds)
  .order('verification_tier', { ascending: false });

const playerVerificationTiers: Record<string, VerificationTier> = {};
if (verificationData) {
  for (const row of verificationData) {
    const current = playerVerificationTiers[row.athlete_id];
    const incoming = row.verification_tier as VerificationTier;
    if (
      !current ||
      (VERIFICATION_TIERS[incoming]?.order ?? 0) > (VERIFICATION_TIERS[current]?.order ?? 0)
    ) {
      playerVerificationTiers[row.athlete_id] = incoming;
    }
  }
}
```

Then pass `verification_tier: playerVerificationTiers[playerId]` to the `computeFit()` call for each player.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/anirudhtumuluru/onlysports-platform && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add hooks/scouting-context.tsx
git commit -m "feat: verification confidence multiplier in scouting algorithm — verified athletes rank higher"
```

---

## Task 10: Scout Search Filter — Minimum Verification Tier

**Files:**

- Modify: `/Users/anirudhtumuluru/onlysports-platform/app/(tabs)/discover.tsx`
- Modify: `/Users/anirudhtumuluru/onlysports-platform/components/home/scout/AthleteMatchCard.tsx`

- [ ] **Step 1: Add verification filter to discover.tsx state**

In the `DiscoverState` interface / useReducer, add:

```typescript
minVerificationTier: VerificationTier | null;
```

Add a new action type:

```typescript
| { type: 'SET_MIN_VERIFICATION'; payload: VerificationTier | null }
```

Handle in reducer:

```typescript
case 'SET_MIN_VERIFICATION':
  return { ...state, minVerificationTier: action.payload };
```

- [ ] **Step 2: Add verification filter dropdown in the filters section**

After the existing filter dropdowns (sport, role), add:

```tsx
{
  /* Verification Filter - only for scouts/coaches */
}
{
  currentUser?.role && ['scout', 'coach', 'team', 'academy'].includes(currentUser.role) && (
    <View style={styles.filterGroup}>
      <Text style={styles.filterLabel}>Min. Verification</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[null, 'app_measured', 'coach_verified', 'center_tested'].map((tier) => (
          <TouchableOpacity
            key={tier ?? 'any'}
            style={[
              styles.filterChip,
              state.minVerificationTier === tier && styles.filterChipActive,
            ]}
            onPress={() =>
              dispatch({ type: 'SET_MIN_VERIFICATION', payload: tier as VerificationTier | null })
            }
          >
            {tier && <VerificationBadge tier={tier as VerificationTier} size="sm" />}
            <Text
              style={[
                styles.filterChipText,
                state.minVerificationTier === tier && styles.filterChipTextActive,
              ]}
            >
              {tier ? getTierMeta(tier as VerificationTier).shortLabel : 'Any'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 3: Add verification badge to AthleteMatchCard**

In `components/home/scout/AthleteMatchCard.tsx`, import:

```typescript
import VerificationBadge from '@/components/VerificationBadge';
import { VerificationTier } from '@/types';
```

Add prop:

```typescript
highestVerificationTier?: VerificationTier;
```

In the render, after the fit score display, add:

```tsx
{
  highestVerificationTier && highestVerificationTier !== 'self_reported' && (
    <VerificationBadge tier={highestVerificationTier} size="sm" showLabel />
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/anirudhtumuluru/onlysports-platform && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add "app/(tabs)/discover.tsx" components/home/scout/AthleteMatchCard.tsx
git commit -m "feat: scout search filter by minimum verification tier + badges on match cards"
```

---

## Task 11: Coach Verification Flow — Verify Result Screen + Notifications

**Files:**

- Create: `/Users/anirudhtumuluru/onlysports-platform/app/verify-result.tsx`
- Modify: `/Users/anirudhtumuluru/onlysports-platform/app/notifications.tsx`

- [ ] **Step 1: Create app/verify-result.tsx**

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react-native';
import { theme, formatRoleName } from '@/constants/theme';
import { useAuth } from '@/hooks/auth-context';
import { useFitnessTest } from '@/hooks/fitness-test-context';
import VerificationBadge from '@/components/VerificationBadge';
import { getTierMeta } from '@/constants/verification';
import { supabase } from '@/constants/supabase';
import CachedImage from '@/components/CachedImage';

export default function VerifyResultScreen() {
  const { requestId, testResultId, athleteName, athleteAvatar, testType, zone, value } = useLocalSearchParams<{
    requestId: string;
    testResultId: string;
    athleteName: string;
    athleteAvatar?: string;
    testType: string;
    zone: string;
    value: string;
  }>();

  const { user } = useAuth();
  const { approveVerification } = useFitnessTest();
  const [isProcessing, setIsProcessing] = useState(false);
  const [notes, setNotes] = useState('');

  const handleApprove = async () => {
    setIsProcessing(true);
    const result = await approveVerification(requestId, testResultId, notes || undefined);
    setIsProcessing(false);
    if (result.error) {
      Alert.alert('Error', result.error);
    } else {
      Alert.alert('Verified!', `${athleteName}'s result has been verified.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    const { error } = await supabase
      .from('verification_requests')
      .update({ status: 'rejected', resolved_at: new Date().toISOString(), coach_notes: notes })
      .eq('id', requestId);
    setIsProcessing(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Declined', 'Verification request declined.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{
        title: 'Verify Result',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
        ),
      }} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.athleteInfo}>
          <CachedImage source={athleteAvatar} size={60} placeholder="avatar" />
          <View>
            <Text style={styles.athleteName}>{athleteName}</Text>
            <Text style={styles.requestLabel}>wants you to verify their result</Text>
          </View>
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.testTypeLabel}>{testType?.replace('_', ' ').toUpperCase()}</Text>
          <Text style={styles.resultValue}>{value}</Text>
          <View style={styles.zoneBadge}>
            <Text style={styles.zoneText}>{zone?.toUpperCase()}</Text>
          </View>
          <VerificationBadge tier="coach_verified" size="lg" showLabel />
          <Text style={styles.upgradeText}>Will upgrade to Coach-Verified</Text>
        </View>

        <Text style={styles.questionText}>
          Did you witness this athlete perform this test?
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.approveBtn]}
            onPress={handleApprove}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <CheckCircle size={20} color="#fff" />
                <Text style={styles.approveBtnText}>Yes, I Verify This</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={handleReject}
            disabled={isProcessing}
          >
            <XCircle size={20} color={theme.colors.danger} />
            <Text style={styles.rejectBtnText}>I Wasn't Present</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  headerButton: { padding: 8 },
  content: { padding: theme.spacing.lg, gap: theme.spacing.lg },
  athleteInfo: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  athleteName: { fontSize: theme.fontSize.lg, color: theme.colors.text, fontWeight: '700' },
  requestLabel: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  resultCard: { alignItems: 'center', padding: theme.spacing.xl, backgroundColor: theme.colors.cardBg, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, gap: 12 },
  testTypeLabel: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, fontWeight: '700', letterSpacing: 1 },
  resultValue: { fontSize: 40, color: theme.colors.text, fontWeight: '900' },
  zoneBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(48,209,88,0.15)' },
  zoneText: { fontSize: theme.fontSize.sm, color: theme.colors.primary, fontWeight: '700' },
  upgradeText: { fontSize: theme.fontSize.xs, color: '#64D2FF', fontWeight: '600' },
  questionText: { fontSize: theme.fontSize.md, color: theme.colors.text, textAlign: 'center', fontWeight: '600' },
  actions: { gap: theme.spacing.md },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 12 },
  approveBtn: { backgroundColor: theme.colors.primary },
  approveBtnText: { color: '#fff', fontSize: theme.fontSize.md, fontWeight: '700' },
  rejectBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border },
  rejectBtnText: { color: theme.colors.danger, fontSize: theme.fontSize.md, fontWeight: '600' },
});
```

- [ ] **Step 2: Handle verification notification in notifications.tsx**

In `app/notifications.tsx`, add a handler for `coach_verification_request` notification type. When tapped, navigate to `/verify-result` with the relevant params:

```typescript
if (notification.type === 'coach_verification_request') {
  router.push({
    pathname: '/verify-result' as any,
    params: notification.data, // { requestId, testResultId, athleteName, etc. }
  });
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/anirudhtumuluru/onlysports-platform && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add app/verify-result.tsx app/notifications.tsx
git commit -m "feat: coach verification screen — one-tap verify/reject athlete fitness results"
```

---

## Task 12: Manual Entry — Mark as Self-Reported + Video Attachment

**Files:**

- Modify: `/Users/anirudhtumuluru/onlysports-platform/app/beep-test-manual.tsx`

- [ ] **Step 1: Add video attachment option to manual entry**

Import:

```typescript
import * as ImagePicker from 'expo-image-picker';
import VerificationBadge from '@/components/VerificationBadge';
import { supabase } from '@/constants/supabase';
```

Add state:

```typescript
const [videoUrl, setVideoUrl] = useState<string | null>(null);
const [isUploadingVideo, setIsUploadingVideo] = useState(false);
```

Add video upload function (same as Task 7 Step 4).

- [ ] **Step 2: Pass self_reported tier and video to save**

In the save handler, update the call:

```typescript
verification_tier: 'self_reported' as const,
video_url: videoUrl,
```

- [ ] **Step 3: Add video upload button in the UI**

Before the save button, add a video attachment section:

```tsx
<TouchableOpacity style={styles.videoAttachBtn} onPress={handleVideoUpload}>
  <Camera size={18} color={theme.colors.textSecondary} />
  <Text style={styles.videoAttachText}>
    {videoUrl ? 'Video attached' : 'Attach video proof (optional)'}
  </Text>
</TouchableOpacity>
```

- [ ] **Step 4: Show verification tier indicator**

Show a small badge indicating this will be "Self-Reported":

```tsx
<View style={styles.tierIndicator}>
  <VerificationBadge tier="self_reported" size="sm" showLabel />
  <Text style={styles.tierHint}>
    Manual entries are Self-Reported. Take the guided test for higher trust.
  </Text>
</View>
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /Users/anirudhtumuluru/onlysports-platform && npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add app/beep-test-manual.tsx
git commit -m "feat: manual entry shows self-reported badge + optional video attachment"
```

---

## Task 13: Update Test Entry Screen — Verification Tiers Explainer

**Files:**

- Modify: `/Users/anirudhtumuluru/onlysports-platform/app/beep-test.tsx`

- [ ] **Step 1: Add verification tiers explanation section**

At the bottom of the test entry screen, before the closing ScrollView, add:

```tsx
{
  /* Verification Tiers Explainer */
}
<View style={styles.tiersSection}>
  <Text style={styles.tiersSectionTitle}>How Verification Works</Text>
  <Text style={styles.tiersSectionDesc}>
    Higher verification = more scout trust = more visibility
  </Text>

  {(['self_reported', 'app_measured', 'coach_verified', 'center_tested'] as const).map((tier) => {
    const meta = getTierMeta(tier);
    return (
      <View key={tier} style={styles.tierRow}>
        <VerificationBadge tier={tier} size="md" showLabel />
        <Text style={styles.tierRowDesc}>{meta.description}</Text>
      </View>
    );
  })}
</View>;
```

Add imports:

```typescript
import VerificationBadge from '@/components/VerificationBadge';
import { getTierMeta } from '@/constants/verification';
```

Add styles:

```typescript
tiersSection: { marginTop: theme.spacing.xl, padding: theme.spacing.md, backgroundColor: theme.colors.cardBg, borderRadius: 12, gap: theme.spacing.sm },
tiersSectionTitle: { fontSize: theme.fontSize.md, color: theme.colors.text, fontWeight: '700' },
tiersSectionDesc: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm },
tierRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, paddingVertical: 6 },
tierRowDesc: { flex: 1, fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/anirudhtumuluru/onlysports-platform && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/beep-test.tsx
git commit -m "feat: add verification tiers explainer on test entry screen"
```

---

## Task 14: Final Integration — Fix Existing Bugs + Polish

**Files:**

- Modify: `/Users/anirudhtumuluru/onlysports-platform/hooks/fitness-test-context.tsx`
- Modify: `/Users/anirudhtumuluru/onlysports-platform/components/home/AthleteHome.tsx`

- [ ] **Step 1: Ensure backward compatibility for existing fitness results**

In `fitness-test-context.tsx`, when fetching results, ensure old results without `verification_tier` get a default:

In `fetchHistoryForAthlete` and `fetchLatestForAthlete`, after the query:

```typescript
// Default verification_tier for legacy results
const results = (data || []).map((r) => ({
  ...r,
  verification_tier:
    r.verification_tier ||
    (r.test_mode === 'coached'
      ? 'coach_verified'
      : r.test_mode === 'self'
        ? 'app_measured'
        : 'self_reported'),
}));
```

- [ ] **Step 2: Add verification upgrade nudge on AthleteHome**

In `components/home/AthleteHome.tsx`, after the stats section, add a nudge for athletes with only self-reported results:

```tsx
{
  /* Verification Nudge */
}
{
  latestByType &&
    Object.values(latestByType).some((r) => r?.verification_tier === 'self_reported') && (
      <TouchableOpacity style={styles.verifyNudge} onPress={() => router.push('/beep-test' as any)}>
        <VerificationBadge tier="app_measured" size="sm" />
        <View style={{ flex: 1 }}>
          <Text style={styles.verifyNudgeTitle}>Upgrade your fitness scores</Text>
          <Text style={styles.verifyNudgeDesc}>
            Take the guided test to get App-Tested verification
          </Text>
        </View>
      </TouchableOpacity>
    );
}
```

- [ ] **Step 3: Run full TypeScript check**

```bash
cd /Users/anirudhtumuluru/onlysports-platform && npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add hooks/fitness-test-context.tsx components/home/AthleteHome.tsx
git commit -m "feat: backward-compatible verification defaults + athlete upgrade nudge"
```

- [ ] **Step 5: Final commit — all verification system files**

```bash
git add -A
git commit -m "feat: complete 4-tier verified fitness testing system

- Self-Reported (gray) → App-Measured (blue) → Coach-Verified (green) → Center-Tested (gold)
- Accelerometer-based turn counting during live Yo-Yo test
- Video proof upload on results + manual entry
- Coach verification flow with one-tap approve/reject
- Verification confidence multiplier in scouting algorithm
- Scout search filter by minimum verification tier
- Verification badges displayed across all profile views
- Anti-cheat: movement pattern validation, stride frequency analysis
- Progressive model: zero barrier entry, incentivized upgrade path"
```
