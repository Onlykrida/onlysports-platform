import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Get Supabase credentials from environment variables only
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Use localStorage on web, AsyncStorage on native
const storage =
  Platform.OS === 'web'
    ? {
        getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
        setItem: (key: string, value: string) => {
          localStorage.setItem(key, value);
          return Promise.resolve();
        },
        removeItem: (key: string) => {
          localStorage.removeItem(key);
          return Promise.resolve();
        },
      }
    : AsyncStorage;

// Check if Supabase is properly configured
const isSupabaseConfigured =
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-ref.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key-here' &&
  !supabaseUrl.includes('dummy');

let supabase: any;

// No-op auth lock for web: bypasses Supabase's default navigator.locks-based
// cross-tab coordination. Multi-tab session-state sync is lost; the
// "lock broken by another user" error is gone. Acceptable for this app
// because users are unlikely to run two tabs with active sessions.
const noopLock = async <R>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<R>,
): Promise<R> => fn();

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
        storage,
        lock: noopLock,
      },
    });
  } catch (error) {
    if (__DEV__) console.error('❌ Failed to create Supabase client:', error);
    supabase = createMockClient();
  }
} else {
  if (__DEV__) {
    console.warn(
      'Supabase not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file.',
    );
  }
  supabase = createMockClient();
}

function createMockClient() {
  const notConfiguredMessage =
    'Supabase is not configured. Please check your .env file and add valid Supabase credentials.';

  const createQueryBuilder = () => {
    const builder: any = {
      select: () => builder,
      eq: () => builder,
      neq: () => builder,
      or: () => builder,
      in: () => builder,
      limit: () => builder,
      order: () => builder,
      head: () => builder,
      single: async () => ({
        data: null,
        error: { code: 'PGRST116', message: notConfiguredMessage },
      }),
      maybeSingle: async () => ({ data: null, error: null }),
      then: (onFulfilled: any, onRejected: any) => {
        return Promise.resolve({ data: [], error: null }).then(onFulfilled, onRejected);
      },
      catch: (onRejected: any) => Promise.resolve({ data: [], error: null }).catch(onRejected),
      finally: (onFinally: any) => Promise.resolve({ data: [], error: null }).finally(onFinally),
    };
    return builder;
  };

  // Mock channel that supports chaining .on() and .subscribe()
  const createMockChannel = () => {
    const channel: any = {
      on: () => channel,
      subscribe: () => channel,
      unsubscribe: () => {},
    };
    return channel;
  };

  // Mock storage bucket
  const createMockStorageBucket = () => ({
    upload: () => Promise.resolve({ data: null, error: { message: notConfiguredMessage } }),
    getPublicUrl: () => ({ data: { publicUrl: '' } }),
    download: () => Promise.resolve({ data: null, error: { message: notConfiguredMessage } }),
    remove: () => Promise.resolve({ data: null, error: { message: notConfiguredMessage } }),
    list: () => Promise.resolve({ data: [], error: null }),
  });

  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: () =>
        Promise.resolve({
          error: { message: notConfiguredMessage },
          data: { user: null, session: null },
        }),
      signUp: () =>
        Promise.resolve({
          error: { message: notConfiguredMessage },
          data: { user: null, session: null },
        }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: () => {
      const mockResult = { data: null, error: { message: notConfiguredMessage } };
      const chainable: any = {
        eq: () => chainable,
        neq: () => chainable,
        or: () => chainable,
        in: () => chainable,
        gte: () => chainable,
        lte: () => chainable,
        then: (onFulfilled: any, onRejected: any) =>
          Promise.resolve(mockResult).then(onFulfilled, onRejected),
        catch: (onRejected: any) => Promise.resolve(mockResult).catch(onRejected),
        finally: (onFinally: any) => Promise.resolve(mockResult).finally(onFinally),
      };
      return {
        select: () => createQueryBuilder(),
        insert: () => ({ select: () => createQueryBuilder(), ...chainable }),
        update: () => chainable,
        upsert: () => ({ select: () => createQueryBuilder(), ...chainable }),
        delete: () => chainable,
      };
    },
    channel: () => createMockChannel(),
    removeChannel: () => {},
    storage: {
      from: () => createMockStorageBucket(),
      listBuckets: () => Promise.resolve({ data: [], error: null }),
    },
  };
}

export { supabase, isSupabaseConfigured };

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          role:
            | 'athlete'
            | 'coach'
            | 'scout'
            | 'team'
            | 'fan'
            | 'trainer'
            | 'gym'
            | 'brand'
            | 'academy';
          avatar?: string;
          bio?: string;
          location?: string;
          verified: boolean;
          sport?: string;
          position?: string;
          achievements?: string[];
          stats?: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role:
            | 'athlete'
            | 'coach'
            | 'scout'
            | 'team'
            | 'fan'
            | 'trainer'
            | 'gym'
            | 'brand'
            | 'academy';
          avatar?: string;
          bio?: string;
          location?: string;
          verified?: boolean;
          sport?: string;
          position?: string;
          achievements?: string[];
          stats?: Record<string, any>;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?:
            | 'athlete'
            | 'coach'
            | 'scout'
            | 'team'
            | 'fan'
            | 'trainer'
            | 'gym'
            | 'brand'
            | 'academy';
          avatar?: string;
          bio?: string;
          location?: string;
          verified?: boolean;
          sport?: string;
          position?: string;
          achievements?: string[];
          stats?: Record<string, any>;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description?: string;
          video_url?: string;
          image_url?: string;
          type: 'highlight' | 'training' | 'match' | 'achievement';
          likes_count: number;
          comments_count: number;
          views_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          title: string;
          description?: string;
          video_url?: string;
          image_url?: string;
          type: 'highlight' | 'training' | 'match' | 'achievement';
        };
        Update: {
          title?: string;
          description?: string;
          video_url?: string;
          image_url?: string;
          type?: 'highlight' | 'training' | 'match' | 'achievement';
        };
      };
      opportunities: {
        Row: {
          id: string;
          team_id: string;
          title: string;
          description: string;
          type: 'tryout' | 'tournament' | 'sponsorship' | 'scholarship';
          sport: string;
          location: string;
          deadline: string;
          requirements?: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          team_id: string;
          title: string;
          description: string;
          type: 'tryout' | 'tournament' | 'sponsorship' | 'scholarship';
          sport: string;
          location: string;
          deadline: string;
          requirements?: string[];
        };
        Update: {
          title?: string;
          description?: string;
          type?: 'tryout' | 'tournament' | 'sponsorship' | 'scholarship';
          sport?: string;
          location?: string;
          deadline?: string;
          requirements?: string[];
        };
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          sender_id: string;
          receiver_id: string;
          content: string;
          read?: boolean;
        };
        Update: {
          content?: string;
          read?: boolean;
        };
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
        };
        Update: {};
      };
      likes: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          post_id: string;
        };
        Update: {};
      };
    };
  };
}
