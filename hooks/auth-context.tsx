import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { User, UserRole } from '@/types';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

/** Create a fallback User from Supabase auth metadata when profile DB is unavailable */
function createFallbackUser(supabaseUser: SupabaseUser): User {
  const role: UserRole = (supabaseUser.user_metadata?.role as UserRole | undefined) ?? 'athlete';
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
    role,
    avatar: supabaseUser.user_metadata?.avatar_url,
    bio: undefined,
    location: undefined,
    verified: false,
    sport: undefined,
    position: undefined,
    achievements: [],
    stats: {},
    roleSpecificData: {},
    createdAt: new Date(supabaseUser.created_at),
  };
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (
    email: string,
    password: string,
    name: string,
    role: UserRole,
  ) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ error?: string }>;
  deleteAccount: () => Promise<{ error?: string }>;
}

const AUTH_DEFAULTS: AuthState = {
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => ({}),
  signup: async () => ({}),
  logout: async () => {},
  updateProfile: async () => ({}),
  deleteAccount: async () => ({}),
};

const [AuthProvider, _useAuth] = createContextHook<AuthState>(() => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      // Safety timeout must be longer than profile timeout (8s) to avoid race
      const timeout = setTimeout(() => {
        if (mounted) {
          if (__DEV__) console.warn('Auth initialization timed out after 10s');
          setIsLoading(false);
        }
      }, 10000);

      try {
        if (__DEV__) console.log('Initializing auth...');

        // Get initial session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        clearTimeout(timeout);

        if (error) {
          if (__DEV__) console.error('Error getting session:', error);
          // Stale-token recovery: if the stored refresh token is invalid
          // (user was deleted server-side, refresh token expired/rotated,
          // session was revoked), force a clean signOut so AsyncStorage /
          // localStorage gets cleared and we land on the welcome screen
          // instead of looping the same crash on every boot.
          const msg = String(error.message || '').toLowerCase();
          if (
            msg.includes('refresh token') ||
            msg.includes('refresh_token') ||
            msg.includes('jwt') ||
            msg.includes('not found')
          ) {
            try {
              await supabase.auth.signOut();
              if (__DEV__) console.log('Cleared stale auth session');
            } catch (signOutErr) {
              if (__DEV__) console.warn('signOut after stale-token detection failed:', signOutErr);
            }
          }
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }

        if (__DEV__) console.log('Initial session:', session?.user?.email || 'No session');

        if (mounted) {
          setSession(session);
          if (session?.user) {
            await loadUserProfile(session.user);
          } else {
            setIsLoading(false);
          }
        }
      } catch (error) {
        clearTimeout(timeout);
        if (__DEV__) console.error('Failed to initialize auth:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes — navigation is handled declaratively by Redirect in _layout.tsx
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, newSession: Session | null) => {
      if (__DEV__)
        console.log('Auth state changed:', event, newSession?.user?.email || 'No session');

      if (!mounted) return;

      setSession(newSession);

      if (newSession?.user) {
        await loadUserProfile(newSession.user);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    // Safety timeout: if profile loading takes longer than 8s, create fallback user
    // and abort the in-flight Supabase query so it can't write a profile after the
    // user has already been routed to home (which used to cause silent late writes).
    let timedOut = false;
    const abortController = new AbortController();
    const profileTimeout = setTimeout(() => {
      timedOut = true;
      if (__DEV__) console.warn('Profile loading timed out after 8s, creating fallback user');
      abortController.abort();
      setUser(createFallbackUser(supabaseUser));
      setIsLoading(false);
    }, 8000);

    try {
      if (__DEV__) console.log('Loading profile for user:', supabaseUser.id);

      // Helper to safely set user only if timeout hasn't fired
      const safeSetUser = (u: User) => {
        if (!timedOut) setUser(u);
      };

      if (!isSupabaseConfigured) {
        if (__DEV__) console.log('Supabase not configured, creating basic user object');
        safeSetUser(createFallbackUser(supabaseUser));
        setIsLoading(false);
        return;
      }

      // Explicit columns, not '*': column-level grants now protect
      // email/push_token, and select('*') fails the WHOLE query (42501)
      // when any ungranted column is included. Own email comes from the
      // auth session (supabaseUser.email), not the profiles row.
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(
          'id, name, role, avatar, cover_photo, bio, location, city, state, verified, sport, position, achievements, stats, role_specific_data, gender, date_of_birth, followers_count, following_count, posts_count, created_at, updated_at',
        )
        .eq('id', supabaseUser.id)
        .abortSignal(abortController.signal)
        .maybeSingle();

      // If the abort fired, supabase-js returns an error; bail out before doing
      // anything else — the timeout handler already set a fallback user.
      if (timedOut) {
        clearTimeout(profileTimeout);
        return;
      }

      if (error) {
        if (__DEV__) {
          console.error('Error loading profile:', {
            code: error.code,
            message: error.message,
            details: error.details,
          });
        }
        // Other database errors - still create basic user to avoid infinite loading
        if (__DEV__)
          console.error('Database error loading profile, creating fallback user:', error.message);
        safeSetUser(createFallbackUser(supabaseUser));
      } else if (!profile) {
        if (__DEV__) console.log('No profile found for user, attempting to create profile...');
        try {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: supabaseUser.id,
              email: supabaseUser.email || '',
              name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
              role: (supabaseUser.user_metadata?.role as UserRole | undefined) ?? 'athlete',
              verified: false,
            })
            .select(
              'id, name, role, avatar, bio, location, verified, sport, position, achievements, stats, role_specific_data, created_at',
            )
            .abortSignal(abortController.signal)
            .single();

          if (createError) {
            if (__DEV__) console.error('Failed to create profile:', createError);
            safeSetUser(createFallbackUser(supabaseUser));
          } else if (newProfile) {
            if (__DEV__) console.log('Profile created successfully:', newProfile);
            const createdUser: User = {
              id: newProfile.id,
              // email comes from the auth session — profiles.email is no longer readable
              email: supabaseUser.email || '',
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
              roleSpecificData: newProfile.role_specific_data || {},
              createdAt: new Date(newProfile.created_at),
            };
            safeSetUser(createdUser);
          }
        } catch (createError) {
          if (__DEV__) console.error('Exception creating profile:', createError);
          safeSetUser(createFallbackUser(supabaseUser));
        }
      } else if (profile) {
        if (__DEV__) console.log('Profile loaded successfully:', profile);
        const loadedUser: User = {
          id: profile.id,
          email: supabaseUser.email || '',
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
          roleSpecificData: profile.role_specific_data || {},
          createdAt: new Date(profile.created_at),
        };
        safeSetUser(loadedUser);
      } else {
        if (__DEV__) console.log('No profile data returned');
        safeSetUser(createFallbackUser(supabaseUser));
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to load user profile:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          error: error,
        });
      }

      // Create fallback user to prevent infinite loading
      if (!timedOut) {
        setUser(createFallbackUser(supabaseUser));
      }
    } finally {
      clearTimeout(profileTimeout);
      if (!timedOut) setIsLoading(false);
    }
  };

  // login does NOT manage isLoading — onAuthStateChange handles the full flow
  const login = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return {
        error: 'Database not configured. Please set up your Supabase credentials in the .env file.',
      };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (__DEV__) console.error('Login error:', error);
        return { error: error.message };
      }

      return {};
    } catch (error) {
      if (__DEV__) console.error('Login failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Login failed. Please try again.';
      return { error: errorMessage };
    }
  }, []);

  const signup = useCallback(
    async (email: string, password: string, name: string, role: UserRole) => {
      if (!isSupabaseConfigured) {
        return {
          error:
            'Database not configured. Please set up your Supabase credentials in the .env file.',
        };
      }

      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, role },
          },
        });

        if (authError) {
          if (__DEV__) console.error('Signup error:', authError);
          return { error: authError.message };
        }

        if (authData.user && authData.session) {
          setSession(authData.session);
          await new Promise((resolve) => setTimeout(resolve, 500));

          if (__DEV__) console.log('Creating profile for user:', authData.user.id);
          let retryCount = 0;
          const maxRetries = 3;

          while (retryCount < maxRetries) {
            try {
              // Check if profile already exists first
              const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', authData.user.id)
                .maybeSingle();

              if (existingProfile) {
                if (__DEV__) console.log('Profile already exists, skipping creation');
                break;
              }

              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .insert({
                  id: authData.user.id,
                  email,
                  name,
                  role,
                  verified: false,
                })
                .select(
                  'id, name, role, avatar, bio, location, verified, sport, position, achievements, stats, role_specific_data, created_at',
                )
                .single();

              if (profileError) {
                if (__DEV__) {
                  console.error('Profile creation error details:', {
                    code: profileError.code,
                    message: profileError.message,
                    details: profileError.details,
                    hint: profileError.hint,
                    retry: retryCount + 1,
                  });
                }

                if (profileError.code === '23505') {
                  if (__DEV__) console.log('Profile already exists (duplicate key), continuing...');
                  break;
                }

                if (profileError.code === '23503' && retryCount < maxRetries - 1) {
                  if (__DEV__)
                    if (__DEV__) {
                      console.log(
                        `Foreign key constraint error, retrying in ${(retryCount + 1) * 1000}ms...`,
                      );
                    }
                  await new Promise((resolve) => setTimeout(resolve, (retryCount + 1) * 1000));
                  retryCount++;
                  continue;
                }

                if (profileError.code === '42501' && retryCount < maxRetries - 1) {
                  if (__DEV__)
                    console.log(`Permission denied, retrying in ${(retryCount + 1) * 1000}ms...`);
                  await new Promise((resolve) => setTimeout(resolve, (retryCount + 1) * 1000));
                  retryCount++;
                  continue;
                }

                let errorMessage = 'Failed to create profile. Please try again.';

                if (profileError.code === '42P01') {
                  errorMessage =
                    'Database table not found. Please run the setup SQL script in your Supabase dashboard.';
                } else if (profileError.code === '42501') {
                  errorMessage =
                    'Permission denied. Please check your database policies or try again in a moment.';
                } else if (profileError.code === '23503') {
                  errorMessage =
                    'Database synchronization issue. Please try signing up again in a moment.';
                } else if (profileError.message) {
                  errorMessage = profileError.message;
                }

                if (__DEV__) console.error('Profile creation returning error:', errorMessage);
                return { error: errorMessage };
              } else {
                if (__DEV__) console.log('Profile created successfully:', profileData);
                break;
              }
            } catch (retryError) {
              if (__DEV__)
                console.error(`Profile creation attempt ${retryCount + 1} failed:`, retryError);
              if (retryCount === maxRetries - 1) {
                throw retryError;
              }
              retryCount++;
              await new Promise((resolve) => setTimeout(resolve, retryCount * 1000));
            }
          }

          await loadUserProfile(authData.user);
          return {};
        }

        if (__DEV__)
          console.log('Signup completed without session (likely email verification required).');
        return {};
      } catch (error) {
        if (__DEV__) console.error('Signup failed:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Signup failed. Please try again.';
        return { error: errorMessage };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      if (__DEV__) console.error('Logout error:', error);
    }
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<User>) => {
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
          error:
            'Database not configured. Please set up your Supabase credentials in the .env file.',
        };
      }

      try {
        let avatarUrl: string | undefined = updates.avatar;
        const inputAvatar: string | undefined =
          typeof updates.avatar === 'string' ? updates.avatar : undefined;
        const isHttp = !!inputAvatar && /^https?:\/\//i.test(inputAvatar);
        const isData = !!inputAvatar && /^data:/i.test(inputAvatar);
        const isLocal = !!inputAvatar && /^(file:\/\/|content:\/\/)/i.test(inputAvatar);

        const shouldTryUpload = !!inputAvatar && (isHttp || isData || isLocal);

        const uriToBlob = async (uri: string, mimeGuess: string): Promise<Blob> => {
          if (/^https?:\/\//i.test(uri) || /^data:/i.test(uri)) {
            const r = await fetch(uri);
            return await r.blob();
          }
          if (/^(file:\/\/|content:\/\/)/i.test(uri)) {
            try {
              // SDK 54+: readAsStringAsync lives in the /legacy entry point;
              // the root export throws a deprecation Error on-device.
              let FileSystem: any = null;
              if (Platform.OS !== 'web') {
                try {
                  FileSystem = require('expo-file-system/legacy');
                } catch {
                  FileSystem = require('expo-file-system');
                }
              }
              if (!FileSystem) throw new Error('File system not available on web');
              const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64' as const,
              });
              const dataUrl = `data:${mimeGuess};base64,${base64}`;
              const r = await fetch(dataUrl);
              return await r.blob();
            } catch (readErr) {
              throw readErr as Error;
            }
          }
          throw new Error('Unsupported URI scheme');
        };

        if (shouldTryUpload) {
          // When a NEW local image fails to upload we must NOT persist the
          // file://content:// URI: it only resolves on the uploading device, so
          // every other user (and this user's next reinstall) sees a blank
          // avatar. Fall back to the previously-saved avatar instead and report
          // the failure so the caller can surface a retry.
          const previousAvatar =
            typeof user?.avatar === 'string' && /^https?:\/\//i.test(user.avatar)
              ? user.avatar
              : undefined;
          try {
            const filenameFromUri =
              inputAvatar!.split('?')[0]?.split('/').pop() ?? `avatar-${Date.now()}.jpg`;
            const ext = filenameFromUri.includes('.')
              ? (filenameFromUri.split('.').pop() as string)
              : 'jpg';
            const guessedType =
              ext.toLowerCase() === 'jpg' || ext.toLowerCase() === 'jpeg'
                ? 'image/jpeg'
                : `image/${ext}`;
            const contentType = guessedType;
            const path = `avatars/${userId}/${Date.now()}-${filenameFromUri}`;

            const blob = await uriToBlob(inputAvatar!, contentType);

            const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(path, blob, { contentType, upsert: false });

            if (!uploadError) {
              const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
              const publicUrl: string | undefined = (pub && (pub as any).publicUrl) || undefined;
              avatarUrl = publicUrl ?? previousAvatar;
              if (__DEV__)
                console.log('Avatar uploaded to storage successfully:', { path, publicUrl });
            } else {
              if (__DEV__) console.warn('Storage upload failed', uploadError);
              // Remote/data URIs are already shareable, so keeping them is safe;
              // only local URIs must be dropped.
              avatarUrl = isLocal ? previousAvatar : inputAvatar;
              if (isLocal) {
                return {
                  error:
                    "Couldn't upload your photo just now — check your connection and try again.",
                };
              }
            }
          } catch (e) {
            if (__DEV__) console.warn('Avatar upload exception', e);
            if (isLocal) {
              return {
                error: "Couldn't upload your photo just now — check your connection and try again.",
              };
            }
            avatarUrl = inputAvatar;
          }
        }

        const payload: Record<string, any> = {
          name: updates.name,
          bio: updates.bio,
          location: updates.location,
          avatar: avatarUrl,
          sport: updates.sport,
          position: updates.position,
          achievements: updates.achievements,
          stats: updates.stats,
          role: updates.role,
          role_specific_data: updates.roleSpecificData,
        };

        Object.keys(payload).forEach((k) => {
          const key = k as keyof typeof payload;
          if (typeof payload[key] === 'undefined') {
            delete payload[key];
          }
        });

        const { error } = await supabase.from('profiles').update(payload).eq('id', userId);

        if (error) {
          if (__DEV__) console.error('Profile update error:', error);
          return { error: error.message };
        }

        if (user && user.id === userId) {
          const updatedUser = { ...user, ...updates, avatar: avatarUrl ?? updates.avatar };
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
        if (__DEV__) console.error('Profile update failed:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update profile. Please try again.';
        return { error: errorMessage };
      }
    },
    [user],
  );

  const deleteAccount = useCallback(async () => {
    if (!user || !session) {
      return { error: 'No user logged in' };
    }

    if (!isSupabaseConfigured) {
      return {
        error: 'Database not configured. Please set up your Supabase credentials in the .env file.',
      };
    }

    try {
      if (__DEV__) console.log('Deleting user account:', user.id);

      // Delete the profile (this will cascade delete all related data)
      const { error: profileError } = await supabase.from('profiles').delete().eq('id', user.id);

      if (profileError) {
        if (__DEV__) console.error('Error deleting profile:', profileError);
        return { error: 'Failed to delete profile. Please try again.' };
      }

      // Sign out the user
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);

      if (__DEV__) console.log('Account deleted successfully');
      return {};
    } catch (error) {
      if (__DEV__) console.error('Account deletion failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete account. Please try again.';
      return { error: errorMessage };
    }
  }, [user, session]);

  return useMemo(
    () => ({
      user,
      session,
      isLoading,
      isAuthenticated: !!user && !!session,
      login,
      signup,
      logout,
      updateProfile,
      deleteAccount,
    }),
    [user, session, isLoading, login, signup, logout, updateProfile, deleteAccount],
  );
});

export { AuthProvider };
export const useAuth = () => _useAuth() ?? AUTH_DEFAULTS;
