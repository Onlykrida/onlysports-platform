import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { User, UserRole } from '@/types';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { router } from 'expo-router';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ error?: string }>;
}

export const [AuthProvider, useAuth] = createContextHook<AuthState>(() => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }
        
        console.log('Initial session:', session?.user?.email || 'No session');
        
        if (mounted) {
          setSession(session);
          if (session?.user) {
            await loadUserProfile(session.user);
          } else {
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      console.log('Auth state changed:', event, session?.user?.email || 'No session');
      
      if (!mounted) return;
      
      setSession(session);
      
      if (session?.user) {
        await loadUserProfile(session.user);
        // Only navigate on explicit sign in, not on session recovery
        if (event === 'SIGNED_IN' && session?.user) {
          // Check if this is a fresh login (not session recovery)
          const isSessionRecovery = session.user.last_sign_in_at && 
            new Date(session.user.last_sign_in_at).getTime() < Date.now() - 5000;
          
          if (!isSessionRecovery) {
            setTimeout(() => {
              try {
                router.replace('/(tabs)' as any);
              } catch (navError) {
                console.error('Navigation error:', navError);
              }
            }, 100);
          }
        }
      } else {
        setUser(null);
        setIsLoading(false);
        // Navigate to auth when user logs out
        if (event === 'SIGNED_OUT') {
          setTimeout(() => {
            try {
              router.replace('/(auth)/welcome' as any);
            } catch (navError) {
              console.error('Navigation error:', navError);
            }
          }, 100);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('Loading profile for user:', supabaseUser.id);
      
      if (!isSupabaseConfigured) {
        console.log('Supabase not configured, creating basic user object');
        const basicUser: User = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
          role: 'athlete' as UserRole,
          avatar: supabaseUser.user_metadata?.avatar_url,
          bio: undefined,
          location: undefined,
          verified: false,
          sport: undefined,
          position: undefined,
          achievements: [],
          stats: {},
          createdAt: new Date(supabaseUser.created_at),
        };
        setUser(basicUser);
        setIsLoading(false);
        return;
      }
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', {
          code: error.code,
          message: error.message,
          details: error.details
        });
        // Other database errors - still create basic user to avoid infinite loading
        console.error('Database error loading profile, creating fallback user:', error.message);
        const basicUser: User = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
          role: 'athlete' as UserRole,
          avatar: supabaseUser.user_metadata?.avatar_url,
          bio: undefined,
          location: undefined,
          verified: false,
          sport: undefined,
          position: undefined,
          achievements: [],
          stats: {},
          createdAt: new Date(supabaseUser.created_at),
        };
        setUser(basicUser);
      } else if (!profile) {
        console.log('No profile found for user, attempting to create profile...');
        try {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: supabaseUser.id,
              email: supabaseUser.email || '',
              name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
              role: 'athlete',
              verified: false,
            })
            .select()
            .single();

          if (createError) {
            console.error('Failed to create profile:', createError);
            const basicUser: User = {
              id: supabaseUser.id,
              email: supabaseUser.email || '',
              name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
              role: 'athlete' as UserRole,
              avatar: supabaseUser.user_metadata?.avatar_url,
              bio: undefined,
              location: undefined,
              verified: false,
              sport: undefined,
              position: undefined,
              achievements: [],
              stats: {},
              createdAt: new Date(supabaseUser.created_at),
            };
            setUser(basicUser);
          } else if (newProfile) {
            console.log('Profile created successfully:', newProfile);
            const user: User = {
              id: newProfile.id,
              email: newProfile.email,
              name: newProfile.name,
              role: newProfile.role as UserRole,
              avatar: newProfile.avatar,
              bio: newProfile.bio,
              location: newProfile.location,
              verified: newProfile.verified,
              sport: newProfile.sport,
              position: newProfile.position,
              achievements: newProfile.achievements || [],
              stats: newProfile.stats || {},
              createdAt: new Date(newProfile.created_at),
            };
            setUser(user);
          }
        } catch (createError) {
          console.error('Exception creating profile:', createError);
          const basicUser: User = {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
            role: 'athlete' as UserRole,
            avatar: supabaseUser.user_metadata?.avatar_url,
            bio: undefined,
            location: undefined,
            verified: false,
            sport: undefined,
            position: undefined,
            achievements: [],
            stats: {},
            createdAt: new Date(supabaseUser.created_at),
          };
          setUser(basicUser);
        }
      } else if (profile) {
        console.log('Profile loaded successfully:', profile);
        const user: User = {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role as UserRole,
          avatar: profile.avatar,
          bio: profile.bio,
          location: profile.location,
          verified: profile.verified,
          sport: profile.sport,
          position: profile.position,
          achievements: profile.achievements || [],
          stats: profile.stats || {},
          createdAt: new Date(profile.created_at),
        };
        setUser(user);
      } else {
        console.log('No profile data returned');
        // Fallback to basic user object
        const basicUser: User = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
          role: 'athlete' as UserRole,
          avatar: supabaseUser.user_metadata?.avatar_url,
          bio: undefined,
          location: undefined,
          verified: false,
          sport: undefined,
          position: undefined,
          achievements: [],
          stats: {},
          createdAt: new Date(supabaseUser.created_at),
        };
        setUser(basicUser);
      }
    } catch (error) {
      console.error('Failed to load user profile:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        error: error
      });
      
      // Create fallback user to prevent infinite loading
      const basicUser: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
        role: 'athlete' as UserRole,
        avatar: supabaseUser.user_metadata?.avatar_url,
        bio: undefined,
        location: undefined,
        verified: false,
        sport: undefined,
        position: undefined,
        achievements: [],
        stats: {},
        createdAt: new Date(supabaseUser.created_at),
      };
      setUser(basicUser);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { 
        error: 'Database not configured. Please set up your Supabase credentials in the .env file.' 
      };
    }

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Login failed:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Login failed. Please try again.';
      return { error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string, role: UserRole) => {
    if (!isSupabaseConfigured) {
      return { 
        error: 'Database not configured. Please set up your Supabase credentials in the .env file.' 
      };
    }

    try {
      setIsLoading(true);
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role },
        },
      });

      if (authError) {
        console.error('Signup error:', authError);
        return { error: authError.message };
      }

      if (authData.user && authData.session) {
        setSession(authData.session);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('Creating profile for user:', authData.user.id);
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: authData.user.id,
                email,
                name,
                role,
                verified: false,
              })
              .select()
              .single();

            if (profileError) {
              console.error('Profile creation error details:', {
                code: profileError.code,
                message: profileError.message,
                details: profileError.details,
                hint: profileError.hint,
                retry: retryCount + 1
              });
              
              if (profileError.code === '23505') {
                console.log('Profile already exists, continuing...');
                break;
              }
              
              if (profileError.code === '23503' && retryCount < maxRetries - 1) {
                console.log(`Foreign key constraint error, retrying in ${(retryCount + 1) * 1000}ms...`);
                await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000));
                retryCount++;
                continue;
              }
              
              if (profileError.code === '42501' && retryCount < maxRetries - 1) {
                console.log(`Permission denied, retrying in ${(retryCount + 1) * 1000}ms...`);
                await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000));
                retryCount++;
                continue;
              }
              
              let errorMessage = 'Failed to create profile. Please try again.';
              
              if (profileError.code === '42P01') {
                errorMessage = 'Database table not found. Please run the setup SQL script in your Supabase dashboard.';
              } else if (profileError.code === '42501') {
                errorMessage = 'Permission denied. Please check your database policies or try again in a moment.';
              } else if (profileError.code === '23503') {
                errorMessage = 'Database synchronization issue. Please try signing up again in a moment.';
              } else if (profileError.message) {
                errorMessage = profileError.message;
              }
              
              console.error('Returning error:', errorMessage);
              return { error: errorMessage };
            } else {
              console.log('Profile created successfully:', profileData);
              break;
            }
          } catch (retryError) {
            console.error(`Profile creation attempt ${retryCount + 1} failed:`, retryError);
            if (retryCount === maxRetries - 1) {
              throw retryError;
            }
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, (retryCount) * 1000));
          }
        }

        await loadUserProfile(authData.user);
        return {};
      }

      console.log('Signup completed without session (likely email verification required).');
      return {};
    } catch (error) {
      console.error('Signup failed:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Signup failed. Please try again.';
      return { error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    const ensureUserId = async (): Promise<string | null> => {
      if (user?.id) return user.id;
      try {
        const { data } = await supabase.auth.getSession();
        const uid = data?.session?.user?.id ?? null;
        return uid;
      } catch {
        return null;
      }
    };

    const userId = await ensureUserId();
    if (!userId) return { error: 'No user logged in' };
    
    if (!isSupabaseConfigured) {
      return { 
        error: 'Database not configured. Please set up your Supabase credentials in the .env file.' 
      };
    }
    
    try {
      const payload = {
        name: updates.name,
        bio: updates.bio,
        location: updates.location,
        avatar: updates.avatar,
        sport: updates.sport,
        position: updates.position,
        achievements: updates.achievements,
        stats: updates.stats,
      } as const;

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', userId);

      if (error) {
        console.error('Profile update error:', error);
        return { error: error.message };
      }

      if (user && user.id === userId) {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
      } else {
        const { data: sessionData } = await supabase.auth.getSession();
        const supaUser = sessionData?.session?.user ?? null;
        if (supaUser) {
          await loadUserProfile(supaUser);
        }
      }
      
      return {};
    } catch (error) {
      console.error('Profile update failed:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to update profile. Please try again.';
      return { error: errorMessage };
    }
  }, [user]);

  return useMemo(() => ({
    user,
    session,
    isLoading,
    isAuthenticated: !!user && !!session,
    login,
    signup,
    logout,
    updateProfile,
  }), [user, session, isLoading, login, signup, logout, updateProfile]);
});