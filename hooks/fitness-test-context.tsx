import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';
import { deriveVerificationTier } from '@/constants/verification';
import { useAuth } from '@/hooks/auth-context';
import { FitnessTestResult, FitnessTestType, FitnessZone, VerificationTier } from '@/types';
import {
  calculateVO2max,
  calculateDistance,
  getZoneName,
  getSpeedForLevel,
  getSprintZone,
  getAgilityZone,
  getVerticalJumpZone,
  getAgeGroup,
  YOYO_LEVELS,
  type Gender,
  type AgeGroup,
} from '@/constants/fitness-test-data';

const TABLE = 'fitness_test_results';

function isTableMissing(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === 'PGRST205' ||
    !!error.message?.includes('does not exist') ||
    !!error.message?.includes('Could not find the table')
  );
}

// ── Derived field helpers ────────────────────────────────

function computeYoYoDerived(level: number, shuttle: number, gender: Gender, ageGroup: AgeGroup) {
  const total_distance = calculateDistance(level, shuttle);
  const vo2max = calculateVO2max(total_distance);
  const zone = getZoneName(total_distance, gender, ageGroup);
  const peak_speed = getSpeedForLevel(level);
  // count total shuttles
  let total_shuttles = 0;
  for (const entry of YOYO_LEVELS) {
    if (entry.level < level) {
      total_shuttles = entry.cumulativeShuttles;
    } else if (entry.level === level) {
      const prevShuttles = YOYO_LEVELS[YOYO_LEVELS.indexOf(entry) - 1]?.cumulativeShuttles ?? 0;
      total_shuttles = prevShuttles + Math.min(shuttle, entry.shuttles);
      break;
    }
  }
  return { vo2max, zone, total_distance, total_shuttles, peak_speed };
}

function computeSprintZone(
  time: number,
  distance: 10 | 20 | 30 | 40,
  gender: Gender,
  ageGroup: AgeGroup,
): FitnessZone {
  return getSprintZone(time, distance, gender, ageGroup).name;
}

function sprintTestTypeForDistance(distance: 10 | 20 | 30 | 40): FitnessTestType {
  switch (distance) {
    case 10:
      return 'sprint_10m';
    case 20:
      return 'sprint_20m';
    case 30:
      return 'sprint_30m';
    case 40:
      return 'sprint_40m';
  }
}

function computeAgilityZone(time: number, gender: Gender, ageGroup: AgeGroup): FitnessZone {
  return getAgilityZone(time, gender, ageGroup).name;
}

function computeJumpZone(height: number, gender: Gender, ageGroup: AgeGroup): FitnessZone {
  return getVerticalJumpZone(height, gender, ageGroup).name;
}

// ── Context Interface ────────────────────────────────────

interface FitnessTestContextValue {
  // Data for current user (athlete)
  latestByType: Partial<Record<FitnessTestType, FitnessTestResult>>;
  history: FitnessTestResult[];
  isLoading: boolean;

  // Save operations
  saveYoYoResult: (data: {
    athlete_id: string;
    conducted_by?: string;
    test_mode: 'self' | 'coached' | 'manual';
    level: number;
    shuttle: number;
    gender?: Gender;
    dateOfBirth?: string;
    notes?: string;
    verification_tier?: VerificationTier;
    video_url?: string;
    sensor_data?: Record<string, any>;
  }) => Promise<{ error?: string; id?: string }>;

  saveSprintResult: (data: {
    athlete_id: string;
    test_mode: 'self' | 'manual';
    sprint_time: number;
    sprint_distance: 10 | 20 | 30 | 40;
    gender?: Gender;
    dateOfBirth?: string;
    notes?: string;
    verification_tier?: VerificationTier;
    video_url?: string;
    sensor_data?: Record<string, any>;
  }) => Promise<{ error?: string; id?: string }>;

  saveAgilityResult: (data: {
    athlete_id: string;
    test_mode: 'self' | 'manual';
    agility_time: number;
    gender?: Gender;
    dateOfBirth?: string;
    notes?: string;
    verification_tier?: VerificationTier;
    video_url?: string;
    sensor_data?: Record<string, any>;
  }) => Promise<{ error?: string; id?: string }>;

  saveJumpResult: (data: {
    athlete_id: string;
    test_mode: 'self' | 'manual';
    jump_height: number;
    gender?: Gender;
    dateOfBirth?: string;
    notes?: string;
    verification_tier?: VerificationTier;
    video_url?: string;
    sensor_data?: Record<string, any>;
  }) => Promise<{ error?: string; id?: string }>;

  saveBatchYoYoResults: (
    results: Array<{
      athlete_id: string;
      conducted_by?: string;
      test_mode: 'coached';
      level: number;
      shuttle: number;
      gender?: Gender;
      dateOfBirth?: string;
    }>,
  ) => Promise<{ error?: string }>;

  // Fetch operations
  fetchLatestForAthlete: (
    athleteId: string,
    testType?: FitnessTestType,
  ) => Promise<FitnessTestResult | null>;
  fetchHistoryForAthlete: (
    athleteId: string,
    testType?: FitnessTestType,
  ) => Promise<FitnessTestResult[]>;
  fetchLatestBatch: (
    athleteIds: string[],
    testType?: FitnessTestType,
  ) => Promise<Map<string, FitnessTestResult>>;
  getHistoryByType: (testType: FitnessTestType) => FitnessTestResult[];

  // Verification
  requestCoachVerification: (testResultId: string, coachId: string) => Promise<{ error?: string }>;
  approveVerification: (
    requestId: string,
    testResultId: string,
    notes?: string,
  ) => Promise<{ error?: string }>;

  // Refresh
  refreshHistory: () => Promise<void>;
}

const FITNESS_TEST_DEFAULTS: FitnessTestContextValue = {
  latestByType: {},
  history: [],
  isLoading: false,
  saveYoYoResult: async () => ({}),
  saveSprintResult: async () => ({}),
  saveAgilityResult: async () => ({}),
  saveJumpResult: async () => ({}),
  saveBatchYoYoResults: async () => ({}),
  fetchLatestForAthlete: async () => null,
  fetchHistoryForAthlete: async () => [],
  fetchLatestBatch: async () => new Map(),
  getHistoryByType: () => [],
  requestCoachVerification: async () => ({}),
  approveVerification: async () => ({}),
  refreshHistory: async () => {},
};

const [FitnessTestProvider, _useFitnessTest] = createContextHook<FitnessTestContextValue>(() => {
  const { user: currentUser } = useAuth();

  const [latestByType, setLatestByType] = useState<
    Partial<Record<FitnessTestType, FitnessTestResult>>
  >({});
  const [history, setHistory] = useState<FitnessTestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ── Gender & age group from current user ──────────────

  const userGender = useMemo<Gender>(
    () => ((currentUser as any)?.gender === 'female' ? 'female' : 'male'),
    [currentUser],
  );

  const userAgeGroup = useMemo<AgeGroup>(
    () => getAgeGroup((currentUser as any)?.date_of_birth),
    [currentUser],
  );

  // ── Fetch: latest result per athlete (optionally filtered by test type) ──

  const fetchLatestForAthlete = useCallback(
    async (athleteId: string, testType?: FitnessTestType): Promise<FitnessTestResult | null> => {
      if (!isSupabaseConfigured) return null;
      try {
        let query = supabase.from(TABLE).select('*').eq('athlete_id', athleteId);
        if (testType) query = query.eq('test_type', testType);
        const { data, error } = await query.order('test_date', { ascending: false }).limit(1);
        if (error) {
          if (isTableMissing(error)) return null;
          if (__DEV__) console.log('FitnessTest: fetchLatest error', error);
          return null;
        }
        const results = (data || []).map((r: any) => ({
          ...r,
          verification_tier: deriveVerificationTier({
            explicit: r.verification_tier,
            test_mode: r.test_mode,
            has_sensor_data: !!r.sensor_data,
          }),
        }));
        return (results as unknown as FitnessTestResult[])?.[0] ?? null;
      } catch (e) {
        if (__DEV__) console.log('FitnessTest: fetchLatest exception', e);
        return null;
      }
    },
    [],
  );

  // ── Fetch: full history ──────────────────────────────

  const fetchHistoryForAthlete = useCallback(
    async (athleteId: string, testType?: FitnessTestType): Promise<FitnessTestResult[]> => {
      if (!isSupabaseConfigured) return [];
      try {
        let query = supabase.from(TABLE).select('*').eq('athlete_id', athleteId);
        if (testType) query = query.eq('test_type', testType);
        const { data, error } = await query.order('test_date', { ascending: false }).limit(50);
        if (error) {
          if (isTableMissing(error)) return [];
          if (__DEV__) console.log('FitnessTest: fetchHistory error', error);
          return [];
        }
        const results = (data || []).map((r: any) => ({
          ...r,
          verification_tier: deriveVerificationTier({
            explicit: r.verification_tier,
            test_mode: r.test_mode,
            has_sensor_data: !!r.sensor_data,
          }),
        }));
        return results as unknown as FitnessTestResult[];
      } catch (e) {
        if (__DEV__) console.log('FitnessTest: fetchHistory exception', e);
        return [];
      }
    },
    [],
  );

  // ── Fetch: batch latest per athlete ──────────────────

  const fetchLatestBatch = useCallback(
    async (
      athleteIds: string[],
      testType?: FitnessTestType,
    ): Promise<Map<string, FitnessTestResult>> => {
      const map = new Map<string, FitnessTestResult>();
      if (!isSupabaseConfigured || athleteIds.length === 0) return map;
      try {
        let query = supabase.from(TABLE).select('*').in('athlete_id', athleteIds);
        if (testType) query = query.eq('test_type', testType);
        const { data, error } = await query.order('test_date', { ascending: false });
        if (error) {
          if (isTableMissing(error)) return map;
          if (__DEV__) console.log('FitnessTest: fetchBatch error', error);
          return map;
        }
        for (const row of (data ?? []) as unknown as FitnessTestResult[]) {
          if (!map.has(row.athlete_id)) map.set(row.athlete_id, row);
        }
        return map;
      } catch (e) {
        if (__DEV__) console.log('FitnessTest: fetchBatch exception', e);
        return map;
      }
    },
    [],
  );

  // ── Get history filtered by type (from local state) ──

  const getHistoryByType = useCallback(
    (testType: FitnessTestType): FitnessTestResult[] => {
      return history.filter((r) => r.test_type === testType);
    },
    [history],
  );

  // ── Save helpers ─────────────────────────────────────

  const refreshAfterSave = useCallback(
    async (athleteId: string) => {
      if (!currentUser || athleteId !== currentUser.id) return;
      const hist = await fetchHistoryForAthlete(currentUser.id);
      setHistory(hist);
      // Build latest-by-type map
      const latest: Partial<Record<FitnessTestType, FitnessTestResult>> = {};
      for (const r of hist) {
        if (!latest[r.test_type]) latest[r.test_type] = r;
      }
      setLatestByType(latest);
    },
    [currentUser, fetchHistoryForAthlete],
  );

  const saveYoYoResult = useCallback(
    async (data: {
      athlete_id: string;
      conducted_by?: string;
      test_mode: 'self' | 'coached' | 'manual';
      level: number;
      shuttle: number;
      gender?: Gender;
      dateOfBirth?: string;
      notes?: string;
      verification_tier?: VerificationTier;
      video_url?: string;
      sensor_data?: Record<string, any>;
    }): Promise<{ error?: string; id?: string }> => {
      if (!isSupabaseConfigured) return { error: 'Database not configured' };
      try {
        const gender = data.gender ?? userGender;
        const ageGroup = data.dateOfBirth ? getAgeGroup(data.dateOfBirth) : userAgeGroup;
        const derived = computeYoYoDerived(data.level, data.shuttle, gender, ageGroup);

        const { data: inserted, error } = await supabase
          .from(TABLE)
          .insert({
            athlete_id: data.athlete_id,
            conducted_by: data.conducted_by ?? null,
            test_type: 'yoyo' as const,
            test_mode: data.test_mode,
            level: data.level,
            shuttle: data.shuttle,
            vo2max: derived.vo2max,
            total_distance: derived.total_distance,
            total_shuttles: derived.total_shuttles,
            peak_speed: derived.peak_speed,
            zone: derived.zone,
            notes: data.notes ?? null,
            verification_tier: deriveVerificationTier({
              explicit: data.verification_tier,
              test_mode: data.test_mode,
              has_sensor_data: !!data.sensor_data,
            }),
            video_url: data.video_url || null,
            sensor_data: data.sensor_data || null,
            verified_by: data.conducted_by || null,
            verified_at: data.conducted_by ? new Date().toISOString() : null,
          })
          .select('id')
          .single();

        if (error) {
          if (isTableMissing(error)) return { error: 'Fitness test table not set up yet' };
          if (__DEV__) console.log('FitnessTest: saveYoYo error', error);
          return { error: error.message };
        }
        await refreshAfterSave(data.athlete_id);
        return { id: (inserted as any)?.id };
      } catch (e) {
        if (__DEV__) console.log('FitnessTest: saveYoYo exception', e);
        return { error: 'Failed to save Yo-Yo result' };
      }
    },
    [userGender, userAgeGroup, refreshAfterSave],
  );

  const saveSprintResult = useCallback(
    async (data: {
      athlete_id: string;
      test_mode: 'self' | 'manual';
      sprint_time: number;
      sprint_distance: 10 | 20 | 30 | 40;
      gender?: Gender;
      dateOfBirth?: string;
      notes?: string;
      verification_tier?: VerificationTier;
      video_url?: string;
      sensor_data?: Record<string, any>;
      conducted_by?: string;
    }): Promise<{ error?: string; id?: string }> => {
      if (!isSupabaseConfigured) return { error: 'Database not configured' };
      try {
        const gender = data.gender ?? userGender;
        const ageGroup = data.dateOfBirth ? getAgeGroup(data.dateOfBirth) : userAgeGroup;
        const zone = computeSprintZone(data.sprint_time, data.sprint_distance, gender, ageGroup);
        const testType: FitnessTestType = sprintTestTypeForDistance(data.sprint_distance);

        const { data: inserted, error } = await supabase
          .from(TABLE)
          .insert({
            athlete_id: data.athlete_id,
            test_type: testType,
            test_mode: data.test_mode,
            sprint_time: data.sprint_time,
            sprint_distance: data.sprint_distance,
            zone,
            notes: data.notes ?? null,
            verification_tier: deriveVerificationTier({
              explicit: data.verification_tier,
              test_mode: data.test_mode,
              has_sensor_data: !!data.sensor_data,
            }),
            video_url: data.video_url || null,
            sensor_data: data.sensor_data || null,
            verified_by: data.conducted_by || null,
            verified_at: data.conducted_by ? new Date().toISOString() : null,
          })
          .select('id')
          .single();

        if (error) {
          if (isTableMissing(error)) return { error: 'Fitness test table not set up yet' };
          return { error: error.message };
        }
        await refreshAfterSave(data.athlete_id);
        return { id: (inserted as any)?.id };
      } catch (e) {
        return { error: 'Failed to save sprint result' };
      }
    },
    [userGender, userAgeGroup, refreshAfterSave],
  );

  const saveAgilityResult = useCallback(
    async (data: {
      athlete_id: string;
      test_mode: 'self' | 'manual';
      agility_time: number;
      gender?: Gender;
      dateOfBirth?: string;
      notes?: string;
      verification_tier?: VerificationTier;
      video_url?: string;
      sensor_data?: Record<string, any>;
      conducted_by?: string;
    }): Promise<{ error?: string; id?: string }> => {
      if (!isSupabaseConfigured) return { error: 'Database not configured' };
      try {
        const gender = data.gender ?? userGender;
        const ageGroup = data.dateOfBirth ? getAgeGroup(data.dateOfBirth) : userAgeGroup;
        const zone = computeAgilityZone(data.agility_time, gender, ageGroup);

        const { data: inserted, error } = await supabase
          .from(TABLE)
          .insert({
            athlete_id: data.athlete_id,
            test_type: 'agility_ttest' as const,
            test_mode: data.test_mode,
            agility_time: data.agility_time,
            zone,
            notes: data.notes ?? null,
            verification_tier: deriveVerificationTier({
              explicit: data.verification_tier,
              test_mode: data.test_mode,
              has_sensor_data: !!data.sensor_data,
            }),
            video_url: data.video_url || null,
            sensor_data: data.sensor_data || null,
            verified_by: data.conducted_by || null,
            verified_at: data.conducted_by ? new Date().toISOString() : null,
          })
          .select('id')
          .single();

        if (error) {
          if (isTableMissing(error)) return { error: 'Fitness test table not set up yet' };
          return { error: error.message };
        }
        await refreshAfterSave(data.athlete_id);
        return { id: (inserted as any)?.id };
      } catch (e) {
        return { error: 'Failed to save agility result' };
      }
    },
    [userGender, userAgeGroup, refreshAfterSave],
  );

  const saveJumpResult = useCallback(
    async (data: {
      athlete_id: string;
      test_mode: 'self' | 'manual';
      jump_height: number;
      gender?: Gender;
      dateOfBirth?: string;
      notes?: string;
      verification_tier?: VerificationTier;
      video_url?: string;
      sensor_data?: Record<string, any>;
      conducted_by?: string;
    }): Promise<{ error?: string; id?: string }> => {
      if (!isSupabaseConfigured) return { error: 'Database not configured' };
      try {
        const gender = data.gender ?? userGender;
        const ageGroup = data.dateOfBirth ? getAgeGroup(data.dateOfBirth) : userAgeGroup;
        const zone = computeJumpZone(data.jump_height, gender, ageGroup);

        const { data: inserted, error } = await supabase
          .from(TABLE)
          .insert({
            athlete_id: data.athlete_id,
            test_type: 'vertical_jump' as const,
            test_mode: data.test_mode,
            jump_height: data.jump_height,
            zone,
            notes: data.notes ?? null,
            verification_tier: deriveVerificationTier({
              explicit: data.verification_tier,
              test_mode: data.test_mode,
              has_sensor_data: !!data.sensor_data,
            }),
            video_url: data.video_url || null,
            sensor_data: data.sensor_data || null,
            verified_by: data.conducted_by || null,
            verified_at: data.conducted_by ? new Date().toISOString() : null,
          })
          .select('id')
          .single();

        if (error) {
          if (isTableMissing(error)) return { error: 'Fitness test table not set up yet' };
          return { error: error.message };
        }
        await refreshAfterSave(data.athlete_id);
        return { id: (inserted as any)?.id };
      } catch (e) {
        return { error: 'Failed to save vertical jump result' };
      }
    },
    [userGender, userAgeGroup, refreshAfterSave],
  );

  const saveBatchYoYoResults = useCallback(
    async (
      results: Array<{
        athlete_id: string;
        conducted_by?: string;
        test_mode: 'coached';
        level: number;
        shuttle: number;
        gender?: Gender;
        dateOfBirth?: string;
      }>,
    ): Promise<{ error?: string }> => {
      if (!isSupabaseConfigured) return { error: 'Database not configured' };
      if (results.length === 0) return { error: 'No results to save' };
      try {
        const payloads = results.map((r) => {
          const gender = r.gender ?? 'male';
          const ageGroup = r.dateOfBirth ? getAgeGroup(r.dateOfBirth) : 'senior';
          const derived = computeYoYoDerived(r.level, r.shuttle, gender, ageGroup as AgeGroup);
          return {
            athlete_id: r.athlete_id,
            conducted_by: r.conducted_by ?? null,
            test_type: 'yoyo' as const,
            test_mode: r.test_mode,
            level: r.level,
            shuttle: r.shuttle,
            vo2max: derived.vo2max,
            total_distance: derived.total_distance,
            total_shuttles: derived.total_shuttles,
            peak_speed: derived.peak_speed,
            zone: derived.zone,
            notes: null,
            verification_tier: 'coach_verified' as const,
            verified_by: r.conducted_by || null,
            verified_at: new Date().toISOString(),
          };
        });

        const { error } = await supabase.from(TABLE).insert(payloads);
        if (error) {
          if (isTableMissing(error)) return { error: 'Fitness test table not set up yet' };
          return { error: error.message };
        }
        return {};
      } catch (e) {
        return { error: 'Failed to save batch results' };
      }
    },
    [],
  );

  // ── Refresh ─────────────────────────────────────────

  const refreshHistory = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'athlete') return;
    setIsLoading(true);
    try {
      const hist = await fetchHistoryForAthlete(currentUser.id);
      setHistory(hist);
      const latest: Partial<Record<FitnessTestType, FitnessTestResult>> = {};
      for (const r of hist) {
        if (!latest[r.test_type]) latest[r.test_type] = r;
      }
      setLatestByType(latest);
    } catch (e) {
      if (__DEV__) console.log('FitnessTest: refresh exception', e);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, fetchHistoryForAthlete]);

  // ── Verification helpers ────────────────────────────

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
        return {};
      } catch (e: any) {
        return { error: e.message };
      }
    },
    [currentUser],
  );

  const approveVerification = useCallback(
    async (
      requestId: string,
      testResultId: string,
      notes?: string,
    ): Promise<{ error?: string }> => {
      if (!currentUser) return { error: 'Not authenticated' };
      try {
        const { error: reqError } = await supabase
          .from('verification_requests')
          .update({
            status: 'approved',
            coach_notes: notes,
            resolved_at: new Date().toISOString(),
          })
          .eq('id', requestId);
        if (reqError) return { error: reqError.message };

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

  // ── Auto-load for athletes ─────────────────────────

  useEffect(() => {
    if (currentUser?.role === 'athlete') {
      void refreshHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, currentUser?.role]);

  // ── Return ─────────────────────────────────────────

  return useMemo(
    () => ({
      latestByType,
      history,
      isLoading,
      saveYoYoResult,
      saveSprintResult,
      saveAgilityResult,
      saveJumpResult,
      saveBatchYoYoResults,
      fetchLatestForAthlete,
      fetchHistoryForAthlete,
      fetchLatestBatch,
      getHistoryByType,
      requestCoachVerification,
      approveVerification,
      refreshHistory,
    }),
    [
      latestByType,
      history,
      isLoading,
      saveYoYoResult,
      saveSprintResult,
      saveAgilityResult,
      saveJumpResult,
      saveBatchYoYoResults,
      fetchLatestForAthlete,
      fetchHistoryForAthlete,
      fetchLatestBatch,
      getHistoryByType,
      requestCoachVerification,
      approveVerification,
      refreshHistory,
    ],
  );
});

export { FitnessTestProvider };
export const useFitnessTest = () => _useFitnessTest() ?? FITNESS_TEST_DEFAULTS;
