import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '@/types';
import { mockUsers } from '@/mocks/data';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';
import { useAuth } from '@/hooks/auth-context';

export interface ProfileSearchFilters {
  query?: string;
  sport?: string | null;
  role?: string | null;
  location?: string;
  verifiedOnly?: boolean;
}

export interface ProfileCursor {
  createdAt: string;
  id: string;
}

export interface ProfileSearchPage {
  users: User[];
  nextCursor: ProfileCursor | null;
  error?: string;
}

interface UsersState {
  users: User[];
  isLoading: boolean;
  addOrUpdateUser: (u: User) => Promise<void>;
  findByRole: (role: UserRole) => User[];
  refreshUsers: () => Promise<void>;
  clearAll: () => Promise<void>;
  /**
   * Server-side, filtered, keyset-paginated profile search. This is the
   * scalable discovery path — filters (role/sport/location/verified/text) are
   * pushed into the SQL query so the candidate set is the WHOLE matching
   * population, not an arbitrary unordered LIMIT 200 slice. Pass the previous
   * page's `nextCursor` to fetch the next page.
   */
  searchProfiles: (
    filters: ProfileSearchFilters,
    cursor?: ProfileCursor | null,
    pageSize?: number,
  ) => Promise<ProfileSearchPage>;
}

const STORAGE_KEY = 'users_cache_v2'; // Updated to clear old duplicates
const SEARCH_COLUMNS =
  'id, email, name, role, avatar, bio, location, city, state, verified, sport, position, achievements, stats, role_specific_data, followers_count, following_count, created_at';

// Single source of truth for Supabase profile-row → User mapping.
function mapProfileRow(p: any): User {
  return {
    id: p.id,
    email: p.email,
    name: p.name,
    role: p.role,
    avatar: p.avatar ?? undefined,
    bio: p.bio ?? undefined,
    location: p.location ?? undefined,
    verified: p.verified ?? false,
    sport: p.sport ?? undefined,
    position: p.position ?? undefined,
    achievements: p.achievements ?? [],
    stats: p.stats ?? {},
    roleSpecificData: p.role_specific_data ?? {},
    followersCount: p.followers_count ?? 0,
    followingCount: p.following_count ?? 0,
    createdAt: new Date(p.created_at ?? Date.now()),
  };
}

// Escape a user string for safe interpolation into a PostgREST or() filter.
// Commas and parentheses are structural in PostgREST filter syntax; strip them
// so a search like "a,b)" can't rewrite the query.
function sanitizeFilterValue(v: string): string {
  return v.replace(/[(),]/g, ' ').trim();
}

const USERS_DEFAULTS: UsersState = {
  users: [],
  isLoading: false,
  addOrUpdateUser: async () => {},
  findByRole: () => [],
  refreshUsers: async () => {},
  clearAll: async () => {},
  searchProfiles: async () => ({ users: [], nextCursor: null }),
};

const [UsersProvider, _useUsers] = createContextHook<UsersState>(() => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user: authUser } = useAuth();

  const persist = useCallback(async (list: User[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      if (__DEV__) console.log('UsersProvider: persist failed', e);
    }
  }, []);

  const loadFromStorage = useCallback(async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const parsed = JSON.parse(json) as User[];
        const revived = parsed.map((u) => ({ ...u, createdAt: new Date(u.createdAt) }));
        setUsers(revived);
        return revived;
      }
      return null;
    } catch (e) {
      if (__DEV__) console.log('UsersProvider: loadFromStorage failed', e);
      return null;
    }
  }, []);

  const loadFromRemote = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(SEARCH_COLUMNS)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) {
        if (__DEV__) console.log('UsersProvider: remote load error', error);
        return;
      }
      const remoteUsers: User[] = (data ?? []).map(mapProfileRow);
      // Replace local cache entirely with remote data (no stale mock/test users)
      if (__DEV__) console.log('UsersProvider: loaded', remoteUsers.length, 'users from Supabase');
      setUsers(remoteUsers);
      void persist(remoteUsers);
    } catch (e) {
      if (__DEV__) console.log('UsersProvider: remote load failed', e);
    } finally {
      setIsLoading(false);
    }
  }, [persist]);

  useEffect(() => {
    if (isSupabaseConfigured) {
      // When DB is configured, load from remote directly (skip stale cache)
      void loadFromRemote();
    } else {
      loadFromStorage().then((loaded) => {
        if (!loaded) {
          if (__DEV__) console.log('UsersProvider: seeding mock users (20)');
          setUsers(mockUsers);
          void persist(mockUsers);
        }
      });
    }
  }, [loadFromStorage, loadFromRemote, persist]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const channel = supabase
      .channel('profiles_changes_users')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload: any) => {
          try {
            if (payload.eventType === 'DELETE') {
              // Handle user deletion
              const deletedUserId = payload.old?.id;
              if (deletedUserId) {
                if (__DEV__)
                  console.log('UsersProvider: User deleted, removing from cache:', deletedUserId);
                setUsers((prev) => prev.filter((u) => u.id !== deletedUserId));
              }
              return;
            }

            const row = (payload.new ?? payload.old) as any;
            if (!row) return;
            const updated: User = mapProfileRow(row);
            setUsers((prev) => {
              const exists = prev.some((u) => u.id === updated.id);
              return exists
                ? prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u))
                : [updated, ...prev];
            });
          } catch (e) {
            if (__DEV__) console.log('UsersProvider: profiles change handling failed', e);
          }
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [persist]);

  useEffect(() => {
    if (authUser) {
      setUsers((prev) => {
        const existing = prev.find((u) => u.id === authUser.id);
        const next = existing
          ? prev.map((u) => (u.id === authUser.id ? { ...existing, ...authUser } : u))
          : [{ ...authUser }, ...prev];
        void persist(next);
        return next;
      });
    }
  }, [authUser, persist]);

  const addOrUpdateUser = useCallback(
    async (u: User) => {
      setUsers((prev) => {
        const idx = prev.findIndex((x) => x.id === u.id);
        const list =
          idx >= 0 ? prev.map((x) => (x.id === u.id ? { ...x, ...u } : x)) : [u, ...prev];
        void persist(list);
        return list;
      });
    },
    [persist],
  );

  const findByRole = useCallback(
    (role: UserRole) => {
      return users.filter((u) => u.role === role);
    },
    [users],
  );

  const refreshUsers = useCallback(async () => {
    await loadFromRemote();
  }, [loadFromRemote]);

  const clearAll = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {}
    setUsers([]);
  }, []);

  const searchProfiles = useCallback<UsersState['searchProfiles']>(
    async (filters, cursor = null, pageSize = 20) => {
      // Unconfigured / mock mode: filter the in-memory list so Discover still
      // works without a backend (single page, no real pagination).
      if (!isSupabaseConfigured) {
        const q = (filters.query ?? '').toLowerCase();
        const loc = (filters.location ?? '').toLowerCase();
        const filtered = (users.length ? users : mockUsers).filter((u) => {
          if (authUser?.id && u.id === authUser.id) return false;
          if (filters.role && u.role !== filters.role) return false;
          if (filters.sport && u.sport !== filters.sport) return false;
          if (filters.verifiedOnly && !u.verified) return false;
          if (loc && !(u.location ?? '').toLowerCase().includes(loc)) return false;
          if (
            q &&
            !(
              u.name.toLowerCase().includes(q) ||
              (u.sport ?? '').toLowerCase().includes(q) ||
              (u.bio ?? '').toLowerCase().includes(q)
            )
          )
            return false;
          return true;
        });
        return { users: filtered.slice(0, pageSize), nextCursor: null };
      }

      try {
        let q = supabase
          .from('profiles')
          .select(SEARCH_COLUMNS)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(pageSize);

        if (authUser?.id) q = q.neq('id', authUser.id);
        if (filters.role) q = q.eq('role', filters.role);
        if (filters.sport) q = q.eq('sport', filters.sport);
        if (filters.verifiedOnly) q = q.eq('verified', true);

        if (filters.location?.trim()) {
          const loc = `%${sanitizeFilterValue(filters.location)}%`;
          q = q.or(`location.ilike.${loc},city.ilike.${loc},state.ilike.${loc}`);
        }
        if (filters.query?.trim()) {
          const s = `%${sanitizeFilterValue(filters.query)}%`;
          q = q.or(`name.ilike.${s},sport.ilike.${s},bio.ilike.${s}`);
        }

        // Keyset pagination: rows strictly "after" the cursor under the
        // (created_at DESC, id DESC) ordering. Keyset (not OFFSET) so deep pages
        // stay O(pageSize) at 1M rows.
        if (cursor) {
          q = q.or(
            `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
          );
        }

        const { data, error } = await q;
        if (error) {
          if (__DEV__) console.log('UsersProvider: searchProfiles error', error);
          return { users: [], nextCursor: null, error: error.message };
        }

        const page = (data ?? []).map(mapProfileRow);
        const last = data && data.length ? (data[data.length - 1] as any) : null;
        const nextCursor =
          last && data && data.length === pageSize
            ? { createdAt: last.created_at as string, id: last.id as string }
            : null;
        return { users: page, nextCursor };
      } catch (e: any) {
        if (__DEV__) console.log('UsersProvider: searchProfiles failed', e);
        return { users: [], nextCursor: null, error: e?.message ?? 'search failed' };
      }
    },
    [authUser?.id, users],
  );

  return useMemo(
    () => ({
      users,
      isLoading,
      addOrUpdateUser,
      findByRole,
      refreshUsers,
      clearAll,
      searchProfiles,
    }),
    [users, isLoading, addOrUpdateUser, findByRole, refreshUsers, clearAll, searchProfiles],
  );
});

export { UsersProvider };
export const useUsers = () => _useUsers() ?? USERS_DEFAULTS;
