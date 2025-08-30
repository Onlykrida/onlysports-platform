import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '@/types';
import { mockUsers } from '@/mocks/data';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';
import { useAuth } from '@/hooks/auth-context';

interface UsersState {
  users: User[];
  isLoading: boolean;
  addOrUpdateUser: (u: User) => Promise<void>;
  findByRole: (role: UserRole) => User[];
  refreshUsers: () => Promise<void>;
  clearAll: () => Promise<void>;
}

const STORAGE_KEY = 'users_cache_v1';

export const [UsersProvider, useUsers] = createContextHook<UsersState>(() => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user: authUser } = useAuth();

  const persist = useCallback(async (list: User[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.log('UsersProvider: persist failed', e);
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
      console.log('UsersProvider: loadFromStorage failed', e);
      return null;
    }
  }, []);

  const loadFromRemote = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, role, avatar, bio, location, verified, sport, position, achievements, stats, created_at')
        .limit(200);
      if (error) {
        console.log('UsersProvider: remote load error', error);
        return;
      }
      const remoteUsers: User[] = (data ?? []).map((p: any) => ({
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
        createdAt: new Date(p.created_at ?? Date.now()),
      }));
      setUsers((prev) => {
        const map = new Map<string, User>();
        [...prev, ...remoteUsers].forEach((u) => map.set(u.id, u));
        const merged = Array.from(map.values());
        void persist(merged);
        return merged;
      });
    } catch (e) {
      console.log('UsersProvider: remote load failed', e);
    } finally {
      setIsLoading(false);
    }
  }, [persist]);

  useEffect(() => {
    loadFromStorage().then((loaded) => {
      if (!loaded && !isSupabaseConfigured) {
        console.log('UsersProvider: seeding mock users (20)');
        setUsers(mockUsers);
        void persist(mockUsers);
        return;
      }
      if (isSupabaseConfigured) {
        void loadFromRemote();
      }
    });
  }, [loadFromStorage, loadFromRemote, persist]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const channel = supabase
      .channel('profiles_changes_users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload: any) => {
        try {
          if (payload.eventType === 'DELETE') {
            // Handle user deletion
            const deletedUserId = payload.old?.id;
            if (deletedUserId) {
              console.log('UsersProvider: User deleted, removing from cache:', deletedUserId);
              setUsers((prev) => {
                const filtered = prev.filter((u) => u.id !== deletedUserId);
                void persist(filtered);
                return filtered;
              });
            }
            return;
          }
          
          const row = (payload.new ?? payload.old) as any;
          if (!row) return;
          const updated: User = {
            id: row.id,
            email: row.email,
            name: row.name,
            role: row.role,
            avatar: row.avatar ?? undefined,
            bio: row.bio ?? undefined,
            location: row.location ?? undefined,
            verified: row.verified ?? false,
            sport: row.sport ?? undefined,
            position: row.position ?? undefined,
            achievements: row.achievements ?? [],
            stats: row.stats ?? {},
            createdAt: new Date(row.created_at ?? Date.now()),
          };
          setUsers((prev) => {
            const exists = prev.some((u) => u.id === updated.id);
            const list = exists ? prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)) : [updated, ...prev];
            void persist(list);
            return list;
          });
        } catch (e) {
          console.log('UsersProvider: profiles change handling failed', e);
        }
      })
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

  const addOrUpdateUser = useCallback(async (u: User) => {
    setUsers((prev) => {
      const idx = prev.findIndex((x) => x.id === u.id);
      const list = idx >= 0 ? prev.map((x) => (x.id === u.id ? { ...x, ...u } : x)) : [u, ...prev];
      void persist(list);
      return list;
    });
  }, [persist]);

  const findByRole = useCallback((role: UserRole) => {
    return users.filter((u) => u.role === role);
  }, [users]);

  const refreshUsers = useCallback(async () => {
    await loadFromRemote();
  }, [loadFromRemote]);

  const clearAll = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {}
    setUsers([]);
  }, []);

  return useMemo(() => ({ users, isLoading, addOrUpdateUser, findByRole, refreshUsers, clearAll }), [users, isLoading, addOrUpdateUser, findByRole, refreshUsers, clearAll]);
});
