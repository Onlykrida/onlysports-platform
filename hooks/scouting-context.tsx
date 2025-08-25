import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';
import { useAuth } from '@/hooks/auth-context';
import { useUsers } from '@/hooks/users-context';
import { User } from '@/types';

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
  weight_skill: number;
  weight_speed: number;
  weight_stamina: number;
  weight_position_match: number;
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
  getInterestedForPlayer: (playerId: string, threshold?: number) => Promise<{ scout: User; rec: AIRecommendationRow }[]>;
  refresh: () => Promise<void>;
}

const STORAGE_KEY = 'ai_recommendations_cache_v1';

export const [ScoutingProvider, useScouting] = createContextHook<ScoutingState>(() => {
  const { user: currentUser } = useAuth();
  const { users, refreshUsers } = useUsers();

  const [isReady, setIsReady] = useState<boolean>(false);
  const [isComputing, setIsComputing] = useState<boolean>(false);
  const [topRecommendations, setTopRecommendations] = useState<Record<string, AIRecommendationRow[]>>({});
  const [interestedScouts, setInterestedScouts] = useState<Record<string, { scout: User; rec: AIRecommendationRow }[]>>({});
  const subscriptionsSetup = useRef<boolean>(false);

  const loadCache = useCallback(async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const parsed = JSON.parse(json) as { topRecommendations: Record<string, AIRecommendationRow[]>; interestedScouts: Record<string, { scout: User; rec: AIRecommendationRow }[]> };
        setTopRecommendations(parsed.topRecommendations ?? {});
        setInterestedScouts(parsed.interestedScouts ?? {});
      }
    } catch (e) {
      console.log('ScoutingProvider: loadCache failed', e);
    }
  }, []);

  const persistCache = useCallback(async (tr: Record<string, AIRecommendationRow[]>, is: Record<string, { scout: User; rec: AIRecommendationRow }[]>) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ topRecommendations: tr, interestedScouts: is }));
    } catch (e) {
      console.log('ScoutingProvider: persistCache failed', e);
    }
  }, []);

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

  const computeFit = useCallback((stat: PlayerStatRow, prefs: ScoutPreferencesRow): AIRecommendationRow['breakdown'] & { total: number } => {
    const skill = normalize(stat.skill);
    const speed = normalize(stat.speed);
    const stamina = normalize(stat.stamina);
    const positionMatch = normalize(positionMatchScore(stat.position, prefs.preferred_positions));
    const wSkill = prefs.weight_skill ?? 0.35;
    const wSpeed = prefs.weight_speed ?? 0.25;
    const wStamina = prefs.weight_stamina ?? 0.2;
    const wPos = prefs.weight_position_match ?? 0.2;
    const weightSum = wSkill + wSpeed + wStamina + wPos || 1;
    const total = Math.round(((skill * wSkill + speed * wSpeed + stamina * wStamina + positionMatch * wPos) / weightSum) * 100) / 100;
    return { skill, speed, stamina, positionMatch, total };
  }, []);

  const fetchScoutPrefs = useCallback(async (scoutId: string): Promise<ScoutPreferencesRow | null> => {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from('scout_preferences')
      .select('*')
      .eq('scout_id', scoutId)
      .single();
    if (error) {
      console.log('ScoutingProvider: fetchScoutPrefs error', error);
      return null;
    }
    return data as unknown as ScoutPreferencesRow;
  }, []);

  const fetchAllPlayerStats = useCallback(async (sport?: string): Promise<PlayerStatRow[]> => {
    if (!isSupabaseConfigured) return [];
    const query = supabase
      .from('player_stats')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1000);
    const { data, error } = await query;
    if (error) {
      console.log('ScoutingProvider: fetchAllPlayerStats error', error);
      return [];
    }
    const rows = (data ?? []) as unknown as PlayerStatRow[];
    return sport ? rows.filter((r) => (r.sport ?? '').toLowerCase() === sport.toLowerCase()) : rows;
  }, []);

  const upsertRecommendations = useCallback(async (recs: AIRecommendationRow[]) => {
    if (!isSupabaseConfigured || recs.length === 0) return;
    const payload = recs.map((r) => ({
      scout_id: r.scout_id,
      player_id: r.player_id,
      fit_score: r.fit_score,
      breakdown: r.breakdown,
      notes: r.notes ?? null,
    }));
    const { error } = await supabase.from('ai_recommendations').upsert(payload, { onConflict: 'scout_id,player_id' });
    if (error) {
      console.log('ScoutingProvider: upsertRecommendations error', error);
    }
  }, []);

  const computeForScout = useCallback(async (scoutId: string): Promise<RecommendResult> => {
    if (!isSupabaseConfigured) return { recommendations: [] };
    setIsComputing(true);
    try {
      const prefs = await fetchScoutPrefs(scoutId);
      if (!prefs) return { recommendations: [] };
      const stats = await fetchAllPlayerStats(prefs.sport);
      const recs: AIRecommendationRow[] = stats.map((s) => {
        const fit = computeFit(s, prefs);
        return {
          id: `${scoutId}-${s.player_id}`,
          scout_id: scoutId,
          player_id: s.player_id,
          fit_score: Math.round(fit.total),
          breakdown: { skill: fit.skill, speed: fit.speed, stamina: fit.stamina, positionMatch: fit.positionMatch },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });
      const sorted = [...recs].sort((a, b) => b.fit_score - a.fit_score).slice(0, 20);
      setTopRecommendations((prev) => {
        const next = { ...prev, [scoutId]: sorted };
        void persistCache(next, interestedScouts);
        return next;
      });
      await upsertRecommendations(recs);
      return { recommendations: sorted };
    } catch (e) {
      console.log('ScoutingProvider: computeForScout failed', e);
      return { recommendations: [] };
    } finally {
      setIsComputing(false);
    }
  }, [computeFit, fetchAllPlayerStats, fetchScoutPrefs, upsertRecommendations, interestedScouts, persistCache]);

  const getTopForScout = useCallback(async (scoutId: string, limit: number = 10) => {
    if (topRecommendations[scoutId]?.length) {
      return topRecommendations[scoutId].slice(0, limit);
    }
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('ai_recommendations')
      .select('*')
      .eq('scout_id', scoutId)
      .order('fit_score', { ascending: false })
      .limit(limit);
    if (error) {
      console.log('ScoutingProvider: getTopForScout error', error);
      return [];
    }
    const recs = (data ?? []) as unknown as AIRecommendationRow[];
    setTopRecommendations((prev) => ({ ...prev, [scoutId]: recs }));
    void persistCache({ ...topRecommendations, [scoutId]: recs }, interestedScouts);
    return recs;
  }, [topRecommendations, persistCache, interestedScouts]);

  const getInterestedForPlayer = useCallback(async (playerId: string, threshold: number = 70) => {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('ai_recommendations')
      .select('*')
      .eq('player_id', playerId)
      .gte('fit_score', threshold)
      .order('fit_score', { ascending: false })
      .limit(50);
    if (error) {
      console.log('ScoutingProvider: getInterestedForPlayer error', error);
      return [];
    }
    const recs = (data ?? []) as unknown as AIRecommendationRow[];
    const map: { scout: User; rec: AIRecommendationRow }[] = recs
      .map((r) => ({
        scout: users.find((u) => u.id === r.scout_id && u.role === 'scout') as User,
        rec: r,
      }))
      .filter((x) => !!x.scout);
    setInterestedScouts((prev) => {
      const next = { ...prev, [playerId]: map };
      void persistCache(topRecommendations, next);
      return next;
    });
    return map;
  }, [users, topRecommendations, persistCache]);

  const refresh = useCallback(async () => {
    await loadCache();
    if (currentUser?.role === 'scout') {
      await computeForScout(currentUser.id);
    }
    await refreshUsers();
  }, [currentUser?.id, currentUser?.role, computeForScout, loadCache, refreshUsers]);

  useEffect(() => {
    void loadCache().then(() => setIsReady(true));
  }, [loadCache]);

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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'scout_preferences' }, (payload: any) => {
          const sId = (payload?.new?.scout_id ?? payload?.old?.scout_id) as string | undefined;
          if (sId) {
            void computeForScout(sId);
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
          if (currentUser?.role === 'scout') {
            void computeForScout(currentUser.id);
          }
        })
        .subscribe();

      return () => {
        try {
          supabase.removeChannel(channel);
        } catch {}
      };
    } catch (e) {
      console.log('ScoutingProvider: realtime setup failed', e);
    }
  }, [computeForScout, currentUser?.id, currentUser?.role]);

  return useMemo(() => ({
    isReady,
    isComputing,
    topRecommendations,
    interestedScouts,
    computeForScout,
    getTopForScout,
    getInterestedForPlayer,
    refresh,
  }), [isReady, isComputing, topRecommendations, interestedScouts, computeForScout, getTopForScout, getInterestedForPlayer, refresh]);
});
