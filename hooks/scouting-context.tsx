import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';
import { useAuth } from '@/hooks/auth-context';
import { useUsers } from '@/hooks/users-context';
import { useAnalytics, EVENTS } from '@/hooks/useAnalytics';
import { User, BeepTestResult, VerificationTier } from '@/types';
import { yoyoToEnduranceScore } from '@/constants/fitness-test-data';
import { VERIFICATION_TIERS } from '@/constants/verification';

// ──────────────────────────────────────────────────────────
// Verification Levels — the full talent pipeline
// School > District/Academy > State > National > Professional
// ──────────────────────────────────────────────────────────

export type VerificationLevel = 'school' | 'district' | 'state' | 'national' | 'professional';

export const VERIFICATION_LEVELS: {
  key: VerificationLevel;
  label: string;
  shortLabel: string;
  color: string;
  order: number;
}[] = [
  { key: 'school', label: 'School Level', shortLabel: 'SCH', color: '#C7C7CC', order: 1 },
  { key: 'district', label: 'District / Academy', shortLabel: 'DST', color: '#64D2FF', order: 2 },
  { key: 'state', label: 'State Level', shortLabel: 'STA', color: '#30D158', order: 3 },
  { key: 'national', label: 'National Level', shortLabel: 'NAT', color: '#FF9F0A', order: 4 },
  { key: 'professional', label: 'Professional', shortLabel: 'PRO', color: '#FF453A', order: 5 },
];

export const getVerificationLevel = (level?: VerificationLevel | string) => {
  return VERIFICATION_LEVELS.find((v) => v.key === level) ?? VERIFICATION_LEVELS[0];
};

export const getVerificationOrder = (level?: VerificationLevel | string): number => {
  return getVerificationLevel(level).order;
};

// ──────────────────────────────────────────────────────────
// Shortlist Types
// ──────────────────────────────────────────────────────────

export interface ShortlistEntry {
  id: string;
  scout_id: string;
  athlete_id: string;
  notes: string;
  created_at: string;
  updated_at: string;
  athlete?: User;
}

// ──────────────────────────────────────────────────────────
// Dashboard Types
// ──────────────────────────────────────────────────────────

export interface ScoutDashboardData {
  matchedAthletes: (User & { fitScore: number })[];
  shortlistCount: number;
  viewedCount: number;
  contactedCount: number;
  recentActivity: { type: string; message: string; timestamp: string }[];
}

// ──────────────────────────────────────────────────────────
// Core Types
// ──────────────────────────────────────────────────────────

export interface PlayerStatRow {
  id: string;
  player_id: string;
  sport?: string;
  position?: string;
  skill: number;
  speed: number;
  stamina: number;
  created_at?: string;
  updated_at?: string;
}

export interface ScoutPreferencesRow {
  id: string;
  scout_id: string;
  sport?: string;
  preferred_positions?: string[];
  preferred_regions?: string[];
  min_age?: number;
  max_age?: number;
  min_verification_level?: VerificationLevel;
  weight_skill: number;
  weight_speed: number;
  weight_stamina: number;
  weight_position_match: number;
  weight_endurance: number;
  created_at?: string;
  updated_at?: string;
}

export interface AIRecommendationRow {
  id: string;
  scout_id: string;
  player_id: string;
  fit_score: number;
  breakdown: {
    skill: number;
    speed: number;
    stamina: number;
    positionMatch: number;
    endurance: number;
  };
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

type RecommendResult = {
  recommendations: AIRecommendationRow[];
};

interface ScoutingState {
  isReady: boolean;
  isComputing: boolean;
  topRecommendations: Record<string, AIRecommendationRow[]>;
  interestedScouts: Record<string, { scout: User; rec: AIRecommendationRow }[]>;
  computeForScout: (scoutId: string) => Promise<RecommendResult>;
  getTopForScout: (scoutId: string, limit?: number) => Promise<AIRecommendationRow[]>;
  getInterestedForPlayer: (
    playerId: string,
    threshold?: number,
  ) => Promise<{ scout: User; rec: AIRecommendationRow }[]>;
  refresh: () => Promise<void>;
  expressInterest: (athleteId: string) => Promise<{ error?: string }>;
  removeInterest: (athleteId: string) => Promise<{ error?: string }>;
  hasExpressedInterest: (athleteId: string) => boolean;
  getInterestedOrganizations: (athleteId: string) => Promise<User[]>;
  getInterestedAthletesForOrg: (orgId: string) => Promise<User[]>;
  // Shortlist
  shortlist: ShortlistEntry[];
  shortlistAthlete: (athleteId: string, notes?: string) => Promise<{ error?: string }>;
  removeFromShortlist: (athleteId: string) => Promise<{ error?: string }>;
  updateShortlistNotes: (athleteId: string, notes: string) => Promise<{ error?: string }>;
  getShortlist: () => ShortlistEntry[];
  isShortlisted: (athleteId: string) => boolean;
  // Dashboard
  getScoutDashboard: () => Promise<ScoutDashboardData>;
  dashboardData: ScoutDashboardData | null;
  isDashboardLoading: boolean;
}

const STORAGE_KEY = 'ai_recommendations_cache_v1';
const SHORTLIST_STORAGE_KEY = 'scout_shortlist_cache_v1';

const SCOUTING_DEFAULTS: ScoutingState = {
  isReady: false,
  isComputing: false,
  topRecommendations: {},
  interestedScouts: {},
  computeForScout: async () => ({ recommendations: [] }),
  getTopForScout: async () => [],
  getInterestedForPlayer: async () => [],
  refresh: async () => {},
  expressInterest: async () => ({}),
  removeInterest: async () => ({}),
  hasExpressedInterest: () => false,
  getInterestedOrganizations: async () => [],
  getInterestedAthletesForOrg: async () => [],
  shortlist: [],
  shortlistAthlete: async () => ({}),
  removeFromShortlist: async () => ({}),
  updateShortlistNotes: async () => ({}),
  getShortlist: () => [],
  isShortlisted: () => false,
  getScoutDashboard: async () => ({
    matchedAthletes: [],
    shortlistCount: 0,
    viewedCount: 0,
    contactedCount: 0,
    recentActivity: [],
  }),
  dashboardData: null,
  isDashboardLoading: false,
};

const [ScoutingProvider, _useScouting] = createContextHook<ScoutingState>(() => {
  const { user: currentUser } = useAuth();
  const { users, refreshUsers } = useUsers();
  const { track } = useAnalytics();

  const [isReady, setIsReady] = useState<boolean>(false);
  const [isComputing, setIsComputing] = useState<boolean>(false);
  const [topRecommendations, setTopRecommendations] = useState<
    Record<string, AIRecommendationRow[]>
  >({});
  const [interestedScouts, setInterestedScouts] = useState<
    Record<string, { scout: User; rec: AIRecommendationRow }[]>
  >({});
  const topRecommendationsRef = useRef<Record<string, AIRecommendationRow[]>>({});
  const interestedScoutsRef = useRef<Record<string, { scout: User; rec: AIRecommendationRow }[]>>(
    {},
  );
  const subscriptionsSetup = useRef<boolean>(false);

  // Shortlist state
  const [shortlist, setShortlist] = useState<ShortlistEntry[]>([]);
  const shortlistRef = useRef<ShortlistEntry[]>([]);
  // computeForScout is memoized on stable callbacks only (so it isn't recreated
  // every time the user cache changes). It still needs the *current* users list
  // and signed-in user for the same-city/same-state location boost, so mirror
  // them into refs rather than adding them to the dep array.
  const usersRef = useRef(users);
  const currentUserRef = useRef(currentUser);

  // Dashboard state
  const [dashboardData, setDashboardData] = useState<ScoutDashboardData | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState<boolean>(false);

  // Keep refs in sync with state
  useEffect(() => {
    topRecommendationsRef.current = topRecommendations;
  }, [topRecommendations]);
  useEffect(() => {
    interestedScoutsRef.current = interestedScouts;
  }, [interestedScouts]);
  useEffect(() => {
    shortlistRef.current = shortlist;
  }, [shortlist]);
  useEffect(() => {
    usersRef.current = users;
  }, [users]);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // ──────────────────────────────────────────────────────────
  // Cache helpers
  // ──────────────────────────────────────────────────────────

  const loadCache = useCallback(async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const parsed = JSON.parse(json) as {
          topRecommendations: Record<string, AIRecommendationRow[]>;
          interestedScouts: Record<string, { scout: User; rec: AIRecommendationRow }[]>;
        };
        setTopRecommendations(parsed.topRecommendations ?? {});
        setInterestedScouts(parsed.interestedScouts ?? {});
      }
    } catch (e) {
      if (__DEV__) console.log('ScoutingProvider: loadCache failed', e);
    }
  }, []);

  const persistCache = useCallback(
    async (
      tr: Record<string, AIRecommendationRow[]>,
      is: Record<string, { scout: User; rec: AIRecommendationRow }[]>,
    ) => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ topRecommendations: tr, interestedScouts: is }),
        );
      } catch (e) {
        if (__DEV__) console.log('ScoutingProvider: persistCache failed', e);
      }
    },
    [],
  );

  const loadShortlistCache = useCallback(async () => {
    try {
      const json = await AsyncStorage.getItem(SHORTLIST_STORAGE_KEY);
      if (json) {
        const parsed = JSON.parse(json) as ShortlistEntry[];
        setShortlist(parsed);
      }
    } catch (e) {
      if (__DEV__) console.log('ScoutingProvider: loadShortlistCache failed', e);
    }
  }, []);

  const persistShortlistCache = useCallback(async (entries: ShortlistEntry[]) => {
    try {
      await AsyncStorage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      if (__DEV__) console.log('ScoutingProvider: persistShortlistCache failed', e);
    }
  }, []);

  // ──────────────────────────────────────────────────────────
  // Scoring utilities
  // ──────────────────────────────────────────────────────────

  const normalize = (v: number) => {
    if (Number.isNaN(v)) return 0;
    const clamped = Math.max(0, Math.min(100, v));
    return clamped;
  };

  const positionMatchScore = (playerPos?: string, prefs?: string[]) => {
    if (!playerPos || !prefs || prefs.length === 0) return 50;
    const lower = playerPos.toLowerCase();
    const any = prefs.map((p) => p.toLowerCase());
    if (any.includes(lower)) return 100;
    if (any.some((p) => lower.includes(p) || p.includes(lower))) return 80;
    return 20;
  };

  const computeFit = useCallback(
    (
      stat: PlayerStatRow,
      prefs: ScoutPreferencesRow,
      enduranceScore: number = 50,
      locationMatch?: 'same_city' | 'same_state' | 'same_country',
      playerData?: { verification_tier?: VerificationTier },
    ): AIRecommendationRow['breakdown'] & { total: number } => {
      const skill = normalize(stat.skill);
      const speed = normalize(stat.speed);
      const stamina = normalize(stat.stamina);
      const positionMatch = normalize(positionMatchScore(stat.position, prefs.preferred_positions));
      const endurance = normalize(enduranceScore);
      const wSkill = prefs.weight_skill ?? 0.3;
      const wSpeed = prefs.weight_speed ?? 0.2;
      const wStamina = prefs.weight_stamina ?? 0.15;
      const wPos = prefs.weight_position_match ?? 0.2;
      const wEnd = prefs.weight_endurance ?? 0.15;
      const weightSum = wSkill + wSpeed + wStamina + wPos + wEnd || 1;
      const rawTotal =
        (skill * wSkill +
          speed * wSpeed +
          stamina * wStamina +
          positionMatch * wPos +
          endurance * wEnd) /
        weightSum;
      // Location soft boost: same city +20%, same state +10%
      const locationMultiplier =
        locationMatch === 'same_city' ? 1.2 : locationMatch === 'same_state' ? 1.1 : 1.0;
      const locationAdjusted = Math.min(100, rawTotal * locationMultiplier);

      // Apply verification confidence multiplier
      const vTier: VerificationTier = playerData?.verification_tier || 'self_reported';
      const confidenceMultiplier = VERIFICATION_TIERS[vTier]?.scoutConfidenceMultiplier ?? 0.7;
      // Adjust total by multiplier (keeps score in 0-100 range since max multiplier is 1.1)
      const total = Math.round(Math.min(100, locationAdjusted * confidenceMultiplier) * 100) / 100;

      return { skill, speed, stamina, positionMatch, endurance, total };
    },
    [],
  );

  // ──────────────────────────────────────────────────────────
  // Supabase fetch helpers
  // ──────────────────────────────────────────────────────────

  const fetchScoutPrefs = useCallback(
    async (scoutId: string): Promise<ScoutPreferencesRow | null> => {
      if (!isSupabaseConfigured) return null;
      const { data, error } = await supabase
        .from('scout_preferences')
        .select('*')
        .eq('scout_id', scoutId)
        .single();
      if (error) {
        if (__DEV__) console.log('ScoutingProvider: fetchScoutPrefs error', error);
        return null;
      }
      return data as unknown as ScoutPreferencesRow;
    },
    [],
  );

  const fetchAllPlayerStats = useCallback(async (sport?: string): Promise<PlayerStatRow[]> => {
    if (!isSupabaseConfigured) return [];
    const query = supabase
      .from('player_stats')
      .select('id, player_id, sport, position, skill, speed, stamina, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(200);
    const { data, error } = await query;
    if (error) {
      if (__DEV__) console.log('ScoutingProvider: fetchAllPlayerStats error', error);
      return [];
    }
    if (__DEV__)
      console.log('ScoutingProvider: fetchAllPlayerStats loaded', (data ?? []).length, 'rows');
    const rows = (data ?? []).map((row: any) => ({
      id: row.id,
      player_id: row.player_id,
      sport: row.sport ?? undefined,
      position: row.position ?? undefined,
      skill: Number(row.skill) || 50,
      speed: Number(row.speed) || 50,
      stamina: Number(row.stamina) || 50,
      created_at: row.created_at,
      updated_at: row.updated_at,
    })) as PlayerStatRow[];
    return sport ? rows.filter((r) => (r.sport ?? '').toLowerCase() === sport.toLowerCase()) : rows;
  }, []);

  const upsertRecommendations = useCallback(async (recs: AIRecommendationRow[]) => {
    if (!isSupabaseConfigured || recs.length === 0) return;

    try {
      const payload = recs.map((r) => ({
        scout_id: r.scout_id,
        player_id: r.player_id,
        fit_score: r.fit_score,
        breakdown: r.breakdown,
        notes: r.notes ?? null,
      }));
      const { error } = await supabase
        .from('ai_recommendations')
        .upsert(payload, { onConflict: 'scout_id,player_id' });
      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          if (__DEV__)
            console.log('ScoutingProvider: ai_recommendations table not found, skipping upsert');
          return;
        }
        if (__DEV__) console.log('ScoutingProvider: upsertRecommendations error', error);
      }
    } catch (e) {
      if (__DEV__) console.log('ScoutingProvider: upsertRecommendations exception', e);
    }
  }, []);

  // ──────────────────────────────────────────────────────────
  // AI Recommendation compute
  // ──────────────────────────────────────────────────────────

  const computeForScout = useCallback(
    async (scoutId: string): Promise<RecommendResult> => {
      if (!isSupabaseConfigured) return { recommendations: [] };
      setIsComputing(true);
      try {
        const prefs = await fetchScoutPrefs(scoutId);
        if (!prefs) return { recommendations: [] };
        const stats = await fetchAllPlayerStats(prefs.sport);

        // Batch-fetch Yo-Yo IR1 results for endurance scoring
        const playerIds = stats.map((s) => s.player_id);
        let fitnessTestMap = new Map<string, BeepTestResult>();
        if (playerIds.length > 0) {
          try {
            const { data: fitnessData } = await supabase
              .from('fitness_test_results')
              .select('athlete_id, level, shuttle, vo2max, total_distance, zone, test_date')
              .in('athlete_id', playerIds)
              .eq('test_type', 'yoyo')
              .order('test_date', { ascending: false })
              .limit(200);
            if (fitnessData) {
              for (const row of fitnessData as unknown as BeepTestResult[]) {
                if (!fitnessTestMap.has(row.athlete_id)) {
                  fitnessTestMap.set(row.athlete_id, row);
                }
              }
            }
          } catch {
            // Table may not exist yet — endurance defaults to 50
          }
        }

        // Get highest verification tier for each player
        const playerVerificationTiers: Record<string, VerificationTier> = {};
        if (playerIds.length > 0) {
          try {
            const { data: verificationData } = await supabase
              .from('fitness_test_results')
              .select('athlete_id, verification_tier')
              .in('athlete_id', playerIds);

            if (verificationData) {
              for (const row of verificationData as any[]) {
                const incoming = (row.verification_tier || 'self_reported') as VerificationTier;
                const current = playerVerificationTiers[row.athlete_id];
                if (
                  !current ||
                  (VERIFICATION_TIERS[incoming]?.order ?? 0) >
                    (VERIFICATION_TIERS[current]?.order ?? 0)
                ) {
                  playerVerificationTiers[row.athlete_id] = incoming;
                }
              }
            }
          } catch {
            // Table column may not exist yet — defaults to self_reported
          }
        }

        // Get scout location for soft boost (read live values via refs — see
        // usersRef/currentUserRef above)
        const usersList = usersRef.current;
        const scoutUser = usersList.find((u) => u.id === scoutId) ?? currentUserRef.current;
        const scoutState = scoutUser?.location?.split(',').pop()?.trim().toLowerCase() || '';
        const scoutCity = scoutUser?.location?.split(',')[0]?.trim().toLowerCase() || '';

        const recs: AIRecommendationRow[] = stats.map((s) => {
          const fitnessResult = fitnessTestMap.get(s.player_id);
          const enduranceScore = fitnessResult
            ? yoyoToEnduranceScore(fitnessResult.level, fitnessResult.shuttle)
            : 50; // neutral default

          // Location soft boost
          const athlete = usersList.find((u) => u.id === s.player_id);
          const athleteState = athlete?.location?.split(',').pop()?.trim().toLowerCase() || '';
          const athleteCity = athlete?.location?.split(',')[0]?.trim().toLowerCase() || '';
          let locationMatch: 'same_city' | 'same_state' | 'same_country' | undefined;
          if (scoutCity && athleteCity && scoutCity === athleteCity) {
            locationMatch = 'same_city';
          } else if (scoutState && athleteState && scoutState === athleteState) {
            locationMatch = 'same_state';
          }

          const fit = computeFit(s, prefs, enduranceScore, locationMatch, {
            verification_tier: playerVerificationTiers[s.player_id] || 'self_reported',
          });
          return {
            id: `${scoutId}-${s.player_id}`,
            scout_id: scoutId,
            player_id: s.player_id,
            fit_score: Math.round(fit.total),
            breakdown: {
              skill: fit.skill,
              speed: fit.speed,
              stamina: fit.stamina,
              positionMatch: fit.positionMatch,
              endurance: fit.endurance,
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        });
        const sorted = [...recs].sort((a, b) => b.fit_score - a.fit_score).slice(0, 20);
        await upsertRecommendations(recs);
        setTopRecommendations((prev) => {
          const next = { ...prev, [scoutId]: sorted };
          void persistCache(next, interestedScoutsRef.current);
          return next;
        });
        return { recommendations: sorted };
      } catch (e) {
        if (__DEV__) console.log('ScoutingProvider: computeForScout failed', e);
        return { recommendations: [] };
      } finally {
        setIsComputing(false);
      }
    },
    [computeFit, fetchAllPlayerStats, fetchScoutPrefs, upsertRecommendations, persistCache],
  );

  const getTopForScout = useCallback(
    async (scoutId: string, limit: number = 10) => {
      const cached = topRecommendationsRef.current[scoutId];
      if (cached?.length) {
        return cached.slice(0, limit);
      }
      if (!isSupabaseConfigured) return [];

      try {
        const { data, error } = await supabase
          .from('ai_recommendations')
          .select('*')
          .eq('scout_id', scoutId)
          .order('fit_score', { ascending: false })
          .limit(Math.max(limit, 50));

        if (error) {
          if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
            return [];
          }
          if (__DEV__) console.log('ScoutingProvider: getTopForScout error', error);
          return [];
        }

        const recs = (data ?? []) as unknown as AIRecommendationRow[];
        setTopRecommendations((prev) => {
          const next = { ...prev, [scoutId]: recs };
          void persistCache(next, interestedScoutsRef.current);
          return next;
        });
        return recs.slice(0, limit);
      } catch (e) {
        if (__DEV__) console.log('ScoutingProvider: getTopForScout exception', e);
        return [];
      }
    },
    [persistCache],
  );

  const getInterestedForPlayer = useCallback(
    async (playerId: string, threshold: number = 70) => {
      if (!isSupabaseConfigured) return [];

      try {
        const { data, error } = await supabase
          .from('ai_recommendations')
          .select('*')
          .eq('player_id', playerId)
          .gte('fit_score', threshold)
          .order('fit_score', { ascending: false })
          .limit(50);

        if (error) {
          if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
            if (__DEV__)
              if (__DEV__) {
                console.log(
                  'ScoutingProvider: ai_recommendations table not found, returning empty results',
                );
              }
            return [];
          }
          if (__DEV__) console.log('ScoutingProvider: getInterestedForPlayer error', error);
          return [];
        }

        const recs = (data ?? []) as unknown as AIRecommendationRow[];
        const map: { scout: User; rec: AIRecommendationRow }[] = recs
          .map((r) => {
            const scout = users.find((u) => u.id === r.scout_id && u.role === 'scout');
            if (!scout) return null;
            return { scout, rec: r };
          })
          .filter((x): x is { scout: User; rec: AIRecommendationRow } => x !== null);
        setInterestedScouts((prev) => {
          const next = { ...prev, [playerId]: map };
          void persistCache(topRecommendationsRef.current, next);
          return next;
        });
        return map;
      } catch (e) {
        if (__DEV__) console.log('ScoutingProvider: getInterestedForPlayer exception', e);
        return [];
      }
    },
    [users, persistCache],
  );

  // ──────────────────────────────────────────────────────────
  // Shortlist operations
  // ──────────────────────────────────────────────────────────

  const shortlistAthlete = useCallback(
    async (athleteId: string, notes: string = ''): Promise<{ error?: string }> => {
      if (!currentUser) return { error: 'Not authenticated' };
      if (!['coach', 'scout', 'team', 'academy'].includes(currentUser.role)) {
        return { error: 'Only scouts, coaches, teams, and academies can shortlist athletes' };
      }

      try {
        const now = new Date().toISOString();
        const entry: ShortlistEntry = {
          id: `${currentUser.id}-${athleteId}`,
          scout_id: currentUser.id,
          athlete_id: athleteId,
          notes,
          created_at: now,
          updated_at: now,
          athlete: users.find((u) => u.id === athleteId),
        };

        if (isSupabaseConfigured) {
          const { error } = await supabase.from('scout_shortlist').upsert(
            {
              scout_id: currentUser.id,
              athlete_id: athleteId,
              notes,
              updated_at: now,
            },
            { onConflict: 'scout_id,athlete_id' },
          );

          if (
            error &&
            error.code !== 'PGRST205' &&
            !error.message?.includes('Could not find the table')
          ) {
            if (__DEV__) console.log('ScoutingProvider: shortlistAthlete DB error', error);
          }
        }

        setShortlist((prev) => {
          const filtered = prev.filter(
            (e) => !(e.scout_id === currentUser.id && e.athlete_id === athleteId),
          );
          const next = [entry, ...filtered];
          void persistShortlistCache(next);
          return next;
        });

        track('athlete_shortlisted', { athleteId });
        return {};
      } catch (e) {
        if (__DEV__) console.log('ScoutingProvider: shortlistAthlete failed', e);
        return { error: 'Failed to shortlist athlete' };
      }
    },
    [currentUser, users, persistShortlistCache, track],
  );

  const removeFromShortlist = useCallback(
    async (athleteId: string): Promise<{ error?: string }> => {
      if (!currentUser) return { error: 'Not authenticated' };

      try {
        if (isSupabaseConfigured) {
          const { error } = await supabase
            .from('scout_shortlist')
            .delete()
            .eq('scout_id', currentUser.id)
            .eq('athlete_id', athleteId);

          if (
            error &&
            error.code !== 'PGRST205' &&
            !error.message?.includes('Could not find the table')
          ) {
            if (__DEV__) console.log('ScoutingProvider: removeFromShortlist DB error', error);
          }
        }

        setShortlist((prev) => {
          const next = prev.filter(
            (e) => !(e.scout_id === currentUser.id && e.athlete_id === athleteId),
          );
          void persistShortlistCache(next);
          return next;
        });

        track('athlete_unshortlisted', { athleteId });
        return {};
      } catch (e) {
        if (__DEV__) console.log('ScoutingProvider: removeFromShortlist failed', e);
        return { error: 'Failed to remove from shortlist' };
      }
    },
    [currentUser, persistShortlistCache, track],
  );

  const updateShortlistNotes = useCallback(
    async (athleteId: string, notes: string): Promise<{ error?: string }> => {
      if (!currentUser) return { error: 'Not authenticated' };

      try {
        const now = new Date().toISOString();

        if (isSupabaseConfigured) {
          await supabase
            .from('scout_shortlist')
            .update({ notes, updated_at: now })
            .eq('scout_id', currentUser.id)
            .eq('athlete_id', athleteId);
        }

        setShortlist((prev) => {
          const next = prev.map((e) =>
            e.scout_id === currentUser.id && e.athlete_id === athleteId
              ? { ...e, notes, updated_at: now }
              : e,
          );
          void persistShortlistCache(next);
          return next;
        });

        return {};
      } catch (e) {
        if (__DEV__) console.log('ScoutingProvider: updateShortlistNotes failed', e);
        return { error: 'Failed to update notes' };
      }
    },
    [currentUser, persistShortlistCache],
  );

  const getShortlist = useCallback((): ShortlistEntry[] => {
    if (!currentUser) return [];
    return shortlistRef.current.filter((e) => e.scout_id === currentUser.id);
  }, [currentUser]);

  const isShortlisted = useCallback(
    (athleteId: string): boolean => {
      if (!currentUser) return false;
      return shortlist.some((e) => e.scout_id === currentUser.id && e.athlete_id === athleteId);
    },
    [currentUser, shortlist],
  );

  // ──────────────────────────────────────────────────────────
  // Scout Dashboard aggregation
  // ──────────────────────────────────────────────────────────

  const getScoutDashboard = useCallback(async (): Promise<ScoutDashboardData> => {
    const empty: ScoutDashboardData = {
      matchedAthletes: [],
      shortlistCount: 0,
      viewedCount: 0,
      contactedCount: 0,
      recentActivity: [],
    };
    if (!currentUser) return empty;

    setIsDashboardLoading(true);
    try {
      const recs = topRecommendationsRef.current[currentUser.id] || [];
      const matchedAthletes = recs
        .slice(0, 20)
        .map((rec) => {
          const athlete = users.find((u) => u.id === rec.player_id);
          if (!athlete) return null;
          return { ...athlete, fitScore: rec.fit_score };
        })
        .filter((a): a is User & { fitScore: number } => a !== null);

      const myShortlist = shortlistRef.current.filter((e) => e.scout_id === currentUser.id);
      const viewedCount = recs.length;
      const contactedCount = myShortlist.filter((e) => e.notes && e.notes.length > 0).length;

      const recentActivity: ScoutDashboardData['recentActivity'] = [];

      myShortlist.slice(0, 5).forEach((entry) => {
        const athlete = users.find((u) => u.id === entry.athlete_id);
        recentActivity.push({
          type: 'shortlist',
          message: `Shortlisted ${athlete?.name || 'an athlete'}`,
          timestamp: entry.created_at,
        });
      });

      if (recs.length > 0) {
        recentActivity.push({
          type: 'recommendation',
          message: `${recs.length} athletes matched your preferences`,
          timestamp: recs[0]?.updated_at || new Date().toISOString(),
        });
      }

      recentActivity.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      const data: ScoutDashboardData = {
        matchedAthletes,
        shortlistCount: myShortlist.length,
        viewedCount,
        contactedCount,
        recentActivity: recentActivity.slice(0, 10),
      };

      setDashboardData(data);
      return data;
    } catch (e) {
      if (__DEV__) console.log('ScoutingProvider: getScoutDashboard failed', e);
      return empty;
    } finally {
      setIsDashboardLoading(false);
    }
  }, [currentUser, users]);

  // ──────────────────────────────────────────────────────────
  // Lifecycle & real-time
  // ──────────────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    await loadCache();
    await loadShortlistCache();
    if (currentUser?.role === 'scout') {
      await computeForScout(currentUser.id);
    }
    await refreshUsers();
  }, [
    currentUser?.id,
    currentUser?.role,
    computeForScout,
    loadCache,
    loadShortlistCache,
    refreshUsers,
  ]);

  useEffect(() => {
    const init = async () => {
      await loadCache();
      await loadShortlistCache();
      if (currentUser && ['coach', 'scout', 'team', 'academy'].includes(currentUser.role)) {
        const recs = await getTopForScout(currentUser.id, 20);
        // If no existing recommendations found and user is a scout, compute fresh ones
        if (recs.length === 0 && currentUser.role === 'scout') {
          if (__DEV__)
            if (__DEV__) {
              console.log(
                'ScoutingProvider: No cached recommendations, computing fresh for scout',
                currentUser.id,
              );
            }
          await computeForScout(currentUser.id);
        }
      }
      setIsReady(true);
    };
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadCache, loadShortlistCache, currentUser?.id, currentUser?.role]);

  useEffect(() => {
    if (!isSupabaseConfigured || subscriptionsSetup.current) return;
    subscriptionsSetup.current = true;
    try {
      const channel = supabase
        .channel('ai-recommendations-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'player_stats' }, () => {
          if (currentUser?.role === 'scout') {
            void computeForScout(currentUser.id);
          }
        })
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'scout_preferences' },
          (payload: any) => {
            const sId = (payload?.new?.scout_id ?? payload?.old?.scout_id) as string | undefined;
            if (sId) {
              void computeForScout(sId);
            }
          },
        )
        .subscribe();

      return () => {
        subscriptionsSetup.current = false;
        try {
          supabase.removeChannel(channel);
        } catch {}
      };
    } catch (e) {
      subscriptionsSetup.current = false;
      if (__DEV__) console.log('ScoutingProvider: realtime setup failed', e);
    }
  }, [computeForScout, currentUser?.id, currentUser?.role]);

  // ──────────────────────────────────────────────────────────
  // Express / remove interest (existing)
  // ──────────────────────────────────────────────────────────

  const expressInterest = useCallback(
    async (athleteId: string): Promise<{ error?: string }> => {
      if (!currentUser || !isSupabaseConfigured) {
        return { error: 'Not authenticated or database not configured' };
      }

      if (!['coach', 'scout', 'team', 'academy'].includes(currentUser.role)) {
        return { error: 'Only coaches, scouts, teams, and academies can express interest' };
      }

      try {
        if (__DEV__)
          if (__DEV__) {
            console.log('ScoutingProvider: Expressing interest', {
              scoutId: currentUser.id,
              athleteId,
            });
          }

        const { error: recError } = await supabase.from('ai_recommendations').upsert(
          {
            scout_id: currentUser.id,
            player_id: athleteId,
            fit_score: 85,
            breakdown: {
              skill: 85,
              speed: 85,
              stamina: 85,
              positionMatch: 85,
              endurance: 85,
            },
            notes: 'Manually expressed interest',
          },
          { onConflict: 'scout_id,player_id' },
        );

        if (recError && recError.code !== 'PGRST205') {
          if (__DEV__) console.error('Failed to express interest:', recError);
          return { error: 'Failed to express interest' };
        }

        if (__DEV__) console.log('ScoutingProvider: Interest expressed successfully');
        track(EVENTS.INTEREST_EXPRESSED, { athleteId });

        setTopRecommendations((prev) => {
          const existing = prev[currentUser.id] || [];
          const alreadyExists = existing.some((rec) => rec.player_id === athleteId);
          if (alreadyExists) return prev;

          const newRec: AIRecommendationRow = {
            id: `${currentUser.id}-${athleteId}`,
            scout_id: currentUser.id,
            player_id: athleteId,
            fit_score: 85,
            breakdown: { skill: 85, speed: 85, stamina: 85, positionMatch: 85, endurance: 85 },
            notes: 'Manually expressed interest',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const updated = [newRec, ...existing];
          void persistCache({ ...prev, [currentUser.id]: updated }, interestedScoutsRef.current);
          return { ...prev, [currentUser.id]: updated };
        });

        return {};
      } catch (error) {
        if (__DEV__) console.error('Express interest failed:', error);
        return { error: 'Failed to express interest' };
      }
    },
    [currentUser, persistCache, track],
  );

  const removeInterest = useCallback(
    async (athleteId: string): Promise<{ error?: string }> => {
      if (!currentUser || !isSupabaseConfigured) {
        return { error: 'Not authenticated or database not configured' };
      }

      try {
        if (__DEV__)
          if (__DEV__) {
            console.log('ScoutingProvider: Removing interest', {
              scoutId: currentUser.id,
              athleteId,
            });
          }

        const { error } = await supabase
          .from('ai_recommendations')
          .delete()
          .eq('scout_id', currentUser.id)
          .eq('player_id', athleteId);

        if (error) {
          if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
            if (__DEV__)
              if (__DEV__) {
                console.log(
                  'ScoutingProvider: ai_recommendations table not found, removing from local cache only',
                );
              }
          } else {
            if (__DEV__) console.error('Failed to remove interest:', error);
            return { error: 'Failed to remove interest' };
          }
        }

        if (__DEV__) console.log('ScoutingProvider: Interest removed successfully');

        setTopRecommendations((prev) => {
          const existing = prev[currentUser.id] || [];
          const updated = existing.filter((rec) => rec.player_id !== athleteId);
          void persistCache({ ...prev, [currentUser.id]: updated }, interestedScoutsRef.current);
          return { ...prev, [currentUser.id]: updated };
        });

        return {};
      } catch (error) {
        if (__DEV__) console.error('Remove interest failed:', error);
        return { error: 'Failed to remove interest' };
      }
    },
    [currentUser, persistCache],
  );

  const hasExpressedInterest = useCallback(
    (athleteId: string): boolean => {
      if (!currentUser) return false;
      return !!topRecommendations[currentUser.id]?.some((rec) => rec.player_id === athleteId);
    },
    [currentUser, topRecommendations],
  );

  const getInterestedAthletesForOrg = useCallback(async (orgId: string): Promise<User[]> => {
    if (!isSupabaseConfigured) return [];

    try {
      if (__DEV__) console.log('ScoutingProvider: getInterestedAthletesForOrg', { orgId });
      const { data, error } = await supabase
        .from('ai_recommendations')
        .select('player_id')
        .eq('scout_id', orgId);

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          return [];
        }
        if (__DEV__) console.error('Failed to get interested athletes:', error);
        return [];
      }

      const playerIds = (data || []).map((rec: any) => rec.player_id);
      if (playerIds.length === 0) return [];

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(
          'id, name, avatar, role, sport, position, verified, role_specific_data, email, created_at',
        )
        .in('id', playerIds)
        .eq('role', 'athlete');

      if (profilesError) {
        if (__DEV__) console.error('Failed to get athlete profiles:', profilesError);
        return [];
      }

      if (__DEV__)
        if (__DEV__) {
          console.log('ScoutingProvider: Interested athletes fetched', {
            orgId,
            count: (profilesData || []).length,
          });
        }
      return (profilesData || []).map(
        (profile: any) =>
          ({
            id: profile.id,
            name: profile.name,
            avatar: profile.avatar,
            role: profile.role,
            sport: profile.sport,
            position: profile.position,
            verified: profile.verified,
            email: profile.email,
            createdAt: new Date(profile.created_at),
            roleSpecificData: profile.role_specific_data || {},
          }) as User,
      );
    } catch (error) {
      if (__DEV__) console.error('Get interested athletes failed:', error);
      return [];
    }
  }, []);

  const getInterestedOrganizations = useCallback(async (athleteId: string): Promise<User[]> => {
    if (!isSupabaseConfigured) return [];

    try {
      const { data, error } = await supabase
        .from('ai_recommendations')
        .select('scout_id')
        .eq('player_id', athleteId);

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          return [];
        }
        if (__DEV__) console.error('Failed to get interested organizations:', error);
        return [];
      }

      const scoutIds = (data || []).map((rec: any) => rec.scout_id);
      if (scoutIds.length === 0) return [];

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, avatar, role, sport, verified, role_specific_data, email, created_at')
        .in('id', scoutIds);

      if (profilesError) {
        if (__DEV__) console.error('Failed to get profiles:', profilesError);
        return [];
      }

      return (profilesData || []).map(
        (profile: any) =>
          ({
            id: profile.id,
            name: profile.name,
            avatar: profile.avatar,
            role: profile.role,
            sport: profile.sport,
            verified: profile.verified,
            email: profile.email,
            createdAt: new Date(profile.created_at),
            roleSpecificData: profile.role_specific_data || {},
          }) as User,
      );
    } catch (error) {
      if (__DEV__) console.error('Get interested organizations failed:', error);
      return [];
    }
  }, []);

  return useMemo(
    () => ({
      isReady,
      isComputing,
      topRecommendations,
      interestedScouts,
      computeForScout,
      getTopForScout,
      getInterestedForPlayer,
      refresh,
      expressInterest,
      removeInterest,
      hasExpressedInterest,
      getInterestedOrganizations,
      getInterestedAthletesForOrg,
      // Shortlist
      shortlist,
      shortlistAthlete,
      removeFromShortlist,
      updateShortlistNotes,
      getShortlist,
      isShortlisted,
      // Dashboard
      getScoutDashboard,
      dashboardData,
      isDashboardLoading,
    }),
    [
      isReady,
      isComputing,
      topRecommendations,
      interestedScouts,
      computeForScout,
      getTopForScout,
      getInterestedForPlayer,
      refresh,
      expressInterest,
      removeInterest,
      hasExpressedInterest,
      getInterestedOrganizations,
      getInterestedAthletesForOrg,
      shortlist,
      shortlistAthlete,
      removeFromShortlist,
      updateShortlistNotes,
      getShortlist,
      isShortlisted,
      getScoutDashboard,
      dashboardData,
      isDashboardLoading,
    ],
  );
});

export { ScoutingProvider };
export const useScouting = () => _useScouting() ?? SCOUTING_DEFAULTS;
