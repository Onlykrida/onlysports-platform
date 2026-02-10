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
  expressInterest: (athleteId: string) => Promise<{ error?: string }>;
  removeInterest: (athleteId: string) => Promise<{ error?: string }>;
  hasExpressedInterest: (athleteId: string) => boolean;
  getInterestedOrganizations: (athleteId: string) => Promise<User[]>;
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
    
    try {
      const payload = recs.map((r) => ({
        scout_id: r.scout_id,
        player_id: r.player_id,
        fit_score: r.fit_score,
        breakdown: r.breakdown,
        notes: r.notes ?? null,
      }));
      const { error } = await supabase.from('ai_recommendations').upsert(payload, { onConflict: 'scout_id,player_id' });
      if (error) {
        // If table doesn't exist, skip silently
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          console.log('ScoutingProvider: ai_recommendations table not found, skipping upsert');
          return;
        }
        console.log('ScoutingProvider: upsertRecommendations error', error);
      }
    } catch (e) {
      console.log('ScoutingProvider: upsertRecommendations exception', e);
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
      console.log('ScoutingProvider: Returning cached recommendations', { scoutId, count: topRecommendations[scoutId].length });
      return topRecommendations[scoutId].slice(0, limit);
    }
    if (!isSupabaseConfigured) return [];
    
    try {
      console.log('ScoutingProvider: Fetching recommendations from database', { scoutId, limit });
      const { data, error } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('scout_id', scoutId)
        .order('fit_score', { ascending: false })
        .limit(Math.max(limit, 50));
      
      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          console.log('ScoutingProvider: ai_recommendations table not found, returning empty results');
          return [];
        }
        console.log('ScoutingProvider: getTopForScout error', error);
        return [];
      }
      
      const recs = (data ?? []) as unknown as AIRecommendationRow[];
      console.log('ScoutingProvider: Recommendations fetched', { scoutId, count: recs.length });
      setTopRecommendations((prev) => ({ ...prev, [scoutId]: recs }));
      void persistCache({ ...topRecommendations, [scoutId]: recs }, interestedScouts);
      return recs.slice(0, limit);
    } catch (e) {
      console.log('ScoutingProvider: getTopForScout exception', e);
      return [];
    }
  }, [topRecommendations, persistCache, interestedScouts]);

  const getInterestedForPlayer = useCallback(async (playerId: string, threshold: number = 70) => {
    if (!isSupabaseConfigured) return [];
    
    // Check if ai_recommendations table exists first
    try {
      const { data, error } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('player_id', playerId)
        .gte('fit_score', threshold)
        .order('fit_score', { ascending: false })
        .limit(50);
      
      if (error) {
        // If table doesn't exist, return empty array instead of logging error
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          console.log('ScoutingProvider: ai_recommendations table not found, returning empty results');
          return [];
        }
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
    } catch (e) {
      console.log('ScoutingProvider: getInterestedForPlayer exception', e);
      return [];
    }
  }, [users, topRecommendations, persistCache]);

  const refresh = useCallback(async () => {
    await loadCache();
    if (currentUser?.role === 'scout') {
      await computeForScout(currentUser.id);
    }
    await refreshUsers();
  }, [currentUser?.id, currentUser?.role, computeForScout, loadCache, refreshUsers]);

  useEffect(() => {
    const init = async () => {
      await loadCache();
      if (currentUser && ['coach', 'scout', 'team', 'academy'].includes(currentUser.role)) {
        console.log('ScoutingProvider: Loading recommendations for current user');
        await getTopForScout(currentUser.id, 20);
      }
      setIsReady(true);
    };
    void init();
  }, [loadCache, currentUser?.id, currentUser?.role, getTopForScout]);

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

  const expressInterest = useCallback(async (athleteId: string): Promise<{ error?: string }> => {
    if (!currentUser || !isSupabaseConfigured) {
      return { error: 'Not authenticated or database not configured' };
    }

    if (!['coach', 'scout', 'team', 'academy'].includes(currentUser.role)) {
      return { error: 'Only coaches, scouts, teams, and academies can express interest' };
    }

    try {
      console.log('ScoutingProvider: Expressing interest', { scoutId: currentUser.id, athleteId });
      
      const { error: recError } = await supabase
        .from('ai_recommendations')
        .upsert({
          scout_id: currentUser.id,
          player_id: athleteId,
          fit_score: 85,
          breakdown: {
            skill: 85,
            speed: 85,
            stamina: 85,
            positionMatch: 85
          },
          notes: 'Manually expressed interest',
        }, { onConflict: 'scout_id,player_id' });

      if (recError && recError.code !== 'PGRST205') {
        console.error('Failed to express interest:', recError);
        return { error: 'Failed to express interest' };
      }

      console.log('ScoutingProvider: Interest expressed successfully');
      
      setTopRecommendations((prev) => {
        const existing = prev[currentUser.id] || [];
        const alreadyExists = existing.some(rec => rec.player_id === athleteId);
        if (alreadyExists) return prev;
        
        const newRec: AIRecommendationRow = {
          id: `${currentUser.id}-${athleteId}`,
          scout_id: currentUser.id,
          player_id: athleteId,
          fit_score: 85,
          breakdown: { skill: 85, speed: 85, stamina: 85, positionMatch: 85 },
          notes: 'Manually expressed interest',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        const updated = [newRec, ...existing];
        void persistCache({ ...prev, [currentUser.id]: updated }, interestedScouts);
        return { ...prev, [currentUser.id]: updated };
      });

      return {};
    } catch (error) {
      console.error('Express interest failed:', error);
      return { error: 'Failed to express interest' };
    }
  }, [currentUser, persistCache, interestedScouts]);

  const removeInterest = useCallback(async (athleteId: string): Promise<{ error?: string }> => {
    if (!currentUser || !isSupabaseConfigured) {
      return { error: 'Not authenticated or database not configured' };
    }

    try {
      console.log('ScoutingProvider: Removing interest', { scoutId: currentUser.id, athleteId });
      
      const { error } = await supabase
        .from('ai_recommendations')
        .delete()
        .eq('scout_id', currentUser.id)
        .eq('player_id', athleteId);

      if (error) {
        console.error('Failed to remove interest:', error);
        return { error: 'Failed to remove interest' };
      }

      console.log('ScoutingProvider: Interest removed successfully');
      
      setTopRecommendations((prev) => {
        const existing = prev[currentUser.id] || [];
        const updated = existing.filter(rec => rec.player_id !== athleteId);
        void persistCache({ ...prev, [currentUser.id]: updated }, interestedScouts);
        return { ...prev, [currentUser.id]: updated };
      });

      return {};
    } catch (error) {
      console.error('Remove interest failed:', error);
      return { error: 'Failed to remove interest' };
    }
  }, [currentUser, persistCache, interestedScouts]);

  const hasExpressedInterest = useCallback((athleteId: string): boolean => {
    if (!currentUser) return false;
    const interested = !!topRecommendations[currentUser.id]?.some(rec => rec.player_id === athleteId);
    console.log('ScoutingProvider: hasExpressedInterest', { athleteId, interested, recommendations: topRecommendations[currentUser.id]?.length });
    return interested;
  }, [currentUser, topRecommendations]);

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
        console.error('Failed to get interested organizations:', error);
        return [];
      }
      
      const scoutIds = (data || []).map((rec: any) => rec.scout_id);
      if (scoutIds.length === 0) return [];
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, avatar, role, sport, verified, role_specific_data, email, created_at')
        .in('id', scoutIds);
      
      if (profilesError) {
        console.error('Failed to get profiles:', profilesError);
        return [];
      }
      
      return (profilesData || []).map((profile: any) => ({
        id: profile.id,
        name: profile.name,
        avatar: profile.avatar,
        role: profile.role,
        sport: profile.sport,
        verified: profile.verified,
        email: profile.email,
        createdAt: new Date(profile.created_at),
        roleSpecificData: profile.role_specific_data || {},
      } as User));
    } catch (error) {
      console.error('Get interested organizations failed:', error);
      return [];
    }
  }, []);

  return useMemo(() => ({
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
  }), [isReady, isComputing, topRecommendations, interestedScouts, computeForScout, getTopForScout, getInterestedForPlayer, refresh, expressInterest, removeInterest, hasExpressedInterest, getInterestedOrganizations]);
});
