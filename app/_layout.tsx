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
import { theme } from '@/constants/theme';
import { BackgroundGradient } from '@/components/BackgroundGradient';

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

  // Hide splash screen only after auth resolves
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (__DEV__)
    console.log('RootLayoutNav: isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  if (isLoading) {
    // Keep splash screen visible — return null (not a spinner)
    return null;
  }

  // Redirect unauthenticated users to welcome, authenticated users away from auth screens
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
                      <Stack.Screen
                        name="beep-test"
                        options={{ title: 'Fitness Tests', headerShown: false }}
                      />
                      <Stack.Screen
                        name="beep-test-live"
                        options={{ title: 'Yo-Yo Test', headerShown: false }}
                      />
                      <Stack.Screen
                        name="beep-test-manual"
                        options={{ title: 'Enter Result', headerShown: false }}
                      />
                      <Stack.Screen
                        name="beep-test-results"
                        options={{ title: 'Results', headerShown: false }}
                      />
                      <Stack.Screen
                        name="beep-test-history"
                        options={{ title: 'Fitness History', headerShown: false }}
                      />
                      <Stack.Screen
                        name="ai-assistant"
                        options={{
                          title: 'Krida AI',
                          headerShown: false,
                          presentation: 'modal',
                        }}
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
