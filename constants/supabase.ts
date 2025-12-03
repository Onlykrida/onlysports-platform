import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
let supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
let supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Fallback to direct credentials if environment variables are not loaded
if (!supabaseUrl || !supabaseAnonKey) {
  supabaseUrl = 'https://dcixlerneuuyhsftnifm.supabase.co';
  supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjaXhsZXJuZXV1eWhzZnRuaWZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MDc4NTIsImV4cCI6MjA3MTI4Mzg1Mn0.VN7zdfRWHIhTSWQ0HMEhuBKZ49J7Ks4PHtOB140Yn-c';
  console.log('🔄 Using fallback Supabase credentials');
}

// Debug environment variables
console.log('🔍 Environment variables debug:');
console.log('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl);
console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing');

// Check if Supabase is properly configured
const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project-ref.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key-here' &&
  !supabaseUrl.includes('dummy');

console.log('🔧 Supabase configured:', isSupabaseConfigured);

let supabase: any;

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
    console.log('✅ Supabase client initialized successfully');
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
    supabase = createMockClient();
  }
} else {
  console.warn('⚠️ Supabase not configured. Please update your .env file with valid credentials.');
  console.warn('📝 Instructions:');
  console.warn('1. Go to https://supabase.com/dashboard');
  console.warn('2. Create a new project or select existing one');
  console.warn('3. Go to Settings > API');
  console.warn('4. Copy the Project URL and anon key to your .env file');
  supabase = createMockClient();
}

function createMockClient() {
  const notConfiguredMessage = 'Supabase is not configured. Please check your .env file and add valid Supabase credentials.';

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
      single: async () => ({ data: null, error: { code: 'PGRST116', message: notConfiguredMessage } }),
      then: (onFulfilled: any, onRejected: any) => {
        return Promise.resolve({ data: [], error: null }).then(onFulfilled, onRejected);
      },
      catch: (onRejected: any) => Promise.resolve({ data: [], error: null }).catch(onRejected),
      finally: (onFinally: any) => Promise.resolve({ data: [], error: null }).finally(onFinally),
    };
    return builder;
  };
  
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: () => Promise.resolve({ 
        error: { message: notConfiguredMessage },
        data: { user: null, session: null }
      }),
      signUp: () => Promise.resolve({ 
        error: { message: notConfiguredMessage },
        data: { user: null, session: null }
      }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: () => ({
      select: () => createQueryBuilder(),
      insert: () => Promise.resolve({ error: { message: notConfiguredMessage } }),
      update: () => ({
        eq: () => Promise.resolve({ error: { message: notConfiguredMessage } }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ error: { message: notConfiguredMessage } }),
      }),
    }),
  };
}

let supabaseAdmin: any;

if (isSupabaseConfigured) {
  const serviceRoleKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  if (serviceRoleKey) {
    try {
      supabaseAdmin = createClient(supabaseUrl!, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      console.log('✅ Supabase admin client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to create Supabase admin client:', error);
      supabaseAdmin = null;
    }
  } else {
    console.warn('⚠️ Service role key not found. Admin operations will not be available.');
    supabaseAdmin = null;
  }
} else {
  supabaseAdmin = null;
}

export { supabase, supabaseAdmin, isSupabaseConfigured };

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'athlete' | 'coach' | 'scout' | 'team' | 'fan';
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
          role: 'athlete' | 'coach' | 'scout' | 'team' | 'fan';
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
          role?: 'athlete' | 'coach' | 'scout' | 'team' | 'fan';
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