import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { memo, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '@/hooks/auth-context';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { PostsProvider } from '@/hooks/posts-context';
import { SearchProvider } from '@/hooks/search-context';
import { FollowProvider } from '@/hooks/follow-context';
import { NotificationProvider } from '@/hooks/notifications-context';
import { MessagesProvider } from '@/hooks/messages-context';
import { GroupsProvider } from '@/hooks/group-messages-context';
import { UsersProvider } from '@/hooks/users-context';
import { OpportunitiesProvider } from '@/hooks/opportunities-context';
import { StatusBar } from 'react-native';
import { ScoutingProvider } from '@/hooks/scouting-context';
import { FitnessTestProvider } from '@/hooks/fitness-test-context';
import { AIProvider } from '@/hooks/ai-context';
import ErrorBoundary from '@/components/ErrorBoundary';
import { BackgroundGradient } from '@/components/BackgroundGradient';
import {
  useFonts,
  Archivo_700Bold,
  Archivo_800ExtraBold,
  Archivo_900Black,
} from '@expo-google-fonts/archivo';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function PushNotificationRegistrar() {
  // Only registers when user is authenticated (useAuth inside usePushNotifications)
  usePushNotifications();
  return null;
}

// Grouped providers to reduce nesting depth and isolate re-render domains
const SocialProviders = memo(function SocialProviders({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <FollowProvider>{children}</FollowProvider>
    </NotificationProvider>
  );
});

const CommunicationProviders = memo(function CommunicationProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MessagesProvider>
      <GroupsProvider>{children}</GroupsProvider>
    </MessagesProvider>
  );
});

const ContentProviders = memo(function ContentProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UsersProvider>
      <PostsProvider>
        <ScoutingProvider>
          <FitnessTestProvider>{children}</FitnessTestProvider>
        </ScoutingProvider>
      </PostsProvider>
    </UsersProvider>
  );
});

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();

  // Hide the splash as soon as the layout mounts. Previously we waited for
  // auth to resolve, which froze the user on the splash for up to 10s on
  // cold starts (no cached session, AsyncStorage warming, Supabase first
  // network call). Welcome screen has its own fade-in animation, so it
  // shows immediately while auth resolves in the background. The Redirect
  // components below transition the user to /(tabs) once isAuthenticated
  // flips to true. Net effect: app feels instant on first open.
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  if (__DEV__)
    console.log('RootLayoutNav: isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  // Default to the unauthenticated stack while auth is still resolving.
  // This is safe: if auth resolves to authenticated, the (tabs) Redirect
  // below fires and replaces the welcome screen. If it resolves to
  // unauthenticated, we're already on the right stack.
  if (!isAuthenticated) {
    return (
      <BackgroundGradient>
        <GestureHandlerRootView style={{ flex: 1, overflow: 'hidden' }}>
          <Redirect href={'/(auth)/welcome' as any} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: 'transparent' },
            }}
          >
            <Stack.Screen name="(auth)" />
          </Stack>
        </GestureHandlerRootView>
      </BackgroundGradient>
    );
  }

  return (
    <BackgroundGradient>
      <GestureHandlerRootView style={{ flex: 1, overflow: 'hidden' }}>
        <SearchProvider>
          <SocialProviders>
            <CommunicationProviders>
              <OpportunitiesProvider>
                <ContentProviders>
                  <AIProvider>
                    <PushNotificationRegistrar />
                    <Redirect href={'/(tabs)' as any} />
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        headerBackTitle: 'Back',
                        contentStyle: { backgroundColor: 'transparent' },
                      }}
                    >
                      <Stack.Screen name="(tabs)" />
                      <Stack.Screen
                        name="edit-profile"
                        options={{ title: 'Edit Profile', presentation: 'modal' }}
                      />
                      <Stack.Screen
                        name="settings"
                        options={{ title: 'Settings', presentation: 'modal' }}
                      />
                      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
                      <Stack.Screen name="user/[id]" options={{ title: 'Profile' }} />
                      <Stack.Screen
                        name="team-dashboard"
                        options={{ title: 'Team Dashboard', headerShown: false }}
                      />
                      <Stack.Screen name="chat" options={{ headerShown: false }} />
                      {/* Fitness routes: headerShown must be true — each screen
                          defines its own title + back button via in-component
                          <Stack.Screen options>, which headerShown:false here
                          would suppress (no back button = dead-end flow).
                          beep-test-live still hides the header mid-test via its
                          own override. */}
                      <Stack.Screen
                        name="beep-test"
                        options={{ title: 'Fitness Tests', headerShown: true }}
                      />
                      <Stack.Screen
                        name="beep-test-live"
                        options={{ title: 'Yo-Yo Test', headerShown: true }}
                      />
                      <Stack.Screen
                        name="beep-test-manual"
                        options={{ title: 'Enter Result', headerShown: true }}
                      />
                      <Stack.Screen
                        name="beep-test-results"
                        options={{ title: 'Results', headerShown: true }}
                      />
                      <Stack.Screen
                        name="beep-test-history"
                        options={{ title: 'Fitness History', headerShown: true }}
                      />
                      <Stack.Screen
                        name="guided-test"
                        options={{ title: 'Guided Test', headerShown: true }}
                      />
                      <Stack.Screen
                        name="ai-assistant"
                        options={{
                          title: 'Krida AI',
                          headerShown: false,
                          presentation: 'modal',
                        }}
                      />
                      {/* Screens that set their own headers in-component via
                          <Stack.Screen options={{...}}>. Registered here so the
                          route table is complete and we get a default title
                          before the in-component override kicks in (avoids the
                          "verify-result" route name flashing on push). */}
                      <Stack.Screen name="verify-result" options={{ title: 'Verify Result' }} />
                      <Stack.Screen name="player-stats" options={{ title: 'Player Stats' }} />
                      <Stack.Screen
                        name="scout-preferences"
                        options={{ title: 'Scouting Preferences' }}
                      />
                      <Stack.Screen name="privacy-policy" options={{ title: 'Privacy Policy' }} />
                      <Stack.Screen
                        name="terms-of-service"
                        options={{ title: 'Terms of Service' }}
                      />
                    </Stack>
                  </AIProvider>
                </ContentProviders>
              </OpportunitiesProvider>
            </CommunicationProviders>
          </SocialProviders>
        </SearchProvider>
      </GestureHandlerRootView>
    </BackgroundGradient>
  );
}

export default function RootLayout() {
  // Display typeface (theme.fontFamily.*). Deliberately NOT gated on the
  // splash: hiding the splash instantly is a hard-won fix (4d456c3) — a
  // brief system-font swap on first frames beats re-freezing cold starts.
  useFonts({
    Archivo_700Bold,
    Archivo_800ExtraBold,
    Archivo_900Black,
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AuthProvider>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
          <RootLayoutNav />
        </AuthProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
