import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';

export interface AnalyticsUser {
  id: string;
  full_name: string;
  sport: string;
  age: number;
  gender: string;
  location: string;
  created_at: string;
}

export interface AthleteStats {
  id: string;
  user_id: string;
  speed: number;
  stamina: number;
  strength: number;
  agility: number;
  match_performance: number;
  created_at: string;
}

export interface AnalyticsRanking {
  id: string;
  user_id: string;
  ranking_score: number;
  rank_category: string;
  updated_at: string;
}

export interface AthleteWithStats extends AnalyticsUser {
  stats?: AthleteStats;
  ranking?: AnalyticsRanking;
}

interface AnalyticsState {
  users: AthleteWithStats[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  getAthleteById: (id: string) => AthleteWithStats | undefined;
  getTopAthletes: (limit?: number) => AthleteWithStats[];
  filterBySport: (sport: string) => AthleteWithStats[];
  filterByCategory: (category: string) => AthleteWithStats[];
  filterByLocation: (location: string) => AthleteWithStats[];
  sports: string[];
  categories: string[];
  locations: string[];
}

export const [AnalyticsProvider, useAnalytics] = createContextHook<AnalyticsState>(() => {
  const [users, setUsers] = useState<AthleteWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalyticsData = useCallback(async () => {
    if (!isSupabaseConfigured) {
      console.log('Supabase not configured');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log('Loading analytics data...');

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Error loading users:', usersError);
        setError(usersError.message);
        setIsLoading(false);
        return;
      }

      const { data: statsData, error: statsError } = await supabase
        .from('athlete_stats')
        .select('*');

      if (statsError) {
        console.error('Error loading stats:', statsError);
      }

      const { data: rankingsData, error: rankingsError } = await supabase
        .from('analytics_rankings')
        .select('*')
        .order('ranking_score', { ascending: false });

      if (rankingsError) {
        console.error('Error loading rankings:', rankingsError);
      }

      const combinedData: AthleteWithStats[] = (usersData || []).map((user: AnalyticsUser) => {
        const stats = (statsData || []).find((s: AthleteStats) => s.user_id === user.id);
        const ranking = (rankingsData || []).find((r: AnalyticsRanking) => r.user_id === user.id);
        return {
          ...user,
          stats,
          ranking,
        };
      });

      console.log('Loaded analytics data:', combinedData.length, 'athletes');
      setUsers(combinedData);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  const getAthleteById = useCallback((id: string) => {
    return users.find((u) => u.id === id);
  }, [users]);

  const getTopAthletes = useCallback((limit: number = 10) => {
    return [...users]
      .filter((u) => u.ranking)
      .sort((a, b) => (b.ranking?.ranking_score || 0) - (a.ranking?.ranking_score || 0))
      .slice(0, limit);
  }, [users]);

  const filterBySport = useCallback((sport: string) => {
    return users.filter((u) => u.sport.toLowerCase() === sport.toLowerCase());
  }, [users]);

  const filterByCategory = useCallback((category: string) => {
    return users.filter((u) => u.ranking?.rank_category === category);
  }, [users]);

  const filterByLocation = useCallback((location: string) => {
    return users.filter((u) => u.location === location);
  }, [users]);

  const sports = useMemo(() => {
    return Array.from(new Set(users.map((u) => u.sport))).sort();
  }, [users]);

  const categories = useMemo(() => {
    return Array.from(new Set(users.map((u) => u.ranking?.rank_category).filter((c): c is string => Boolean(c)))).sort();
  }, [users]);

  const locations = useMemo(() => {
    return Array.from(new Set(users.map((u) => u.location))).sort();
  }, [users]);

  return {
    users,
    isLoading,
    error,
    refreshData: loadAnalyticsData,
    getAthleteById,
    getTopAthletes,
    filterBySport,
    filterByCategory,
    filterByLocation,
    sports,
    categories,
    locations,
  };
});
