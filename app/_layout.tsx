import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
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
import { View, ActivityIndicator, StatusBar } from 'react-native';
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

function AppStack() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: 'Back',
        contentStyle: { backgroundColor: 'transparent' },
      }}
      initialRouteName="(tabs)"
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="edit-profile"
        options={{ title: 'Edit Profile', presentation: 'modal' }}
      />
      <Stack.Screen name="settings" options={{ title: 'Settings', presentation: 'modal' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="user/[id]" options={{ title: 'Profile' }} />
      <Stack.Screen
        name="team-dashboard"
        options={{ title: 'Team Dashboard', headerShown: false }}
      />
      <Stack.Screen name="chat" options={{ headerShown: false }} />
      <Stack.Screen name="beep-test" options={{ title: 'Fitness Tests', headerShown: false }} />
      <Stack.Screen name="beep-test-live" options={{ title: 'Yo-Yo Test', headerShown: false }} />
      <Stack.Screen
        name="beep-test-manual"
        options={{ title: 'Enter Result', headerShown: false }}
      />
      <Stack.Screen name="beep-test-results" options={{ title: 'Results', headerShown: false }} />
      <Stack.Screen
        name="beep-test-history"
        options={{ title: 'Fitness History', headerShown: false }}
      />
      <Stack.Screen
        name="ai-assistant"
        options={{ title: 'Krida AI', headerShown: false, presentation: 'modal' }}
      />
    </Stack>
  );
}

// Grouped providers to reduce nesting depth and isolate re-render domains
const SocialProviders = memo(({ children }: { children: React.ReactNode }) => (
  <NotificationProvider>
    <FollowProvider>{children}</FollowProvider>
  </NotificationProvider>
));

const CommunicationProviders = memo(({ children }: { children: React.ReactNode }) => (
  <MessagesProvider>
    <GroupsProvider>{children}</GroupsProvider>
  </MessagesProvider>
));

const ContentProviders = memo(({ children }: { children: React.ReactNode }) => (
  <UsersProvider>
    <PostsProvider>
      <ScoutingProvider>
        <FitnessTestProvider>{children}</FitnessTestProvider>
      </ScoutingProvider>
    </PostsProvider>
  </UsersProvider>
));

const MemoizedAppStack = memo(AppStack);

function AuthenticatedApp() {
  return (
    <SocialProviders>
      <CommunicationProviders>
        <OpportunitiesProvider>
          <ContentProviders>
            <AIProvider>
              <PushNotificationRegistrar />
              <MemoizedAppStack />
            </AIProvider>
          </ContentProviders>
        </OpportunitiesProvider>
      </CommunicationProviders>
    </SocialProviders>
  );
}

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();

  if (__DEV__)
    console.log('RootLayoutNav: isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  if (isLoading) {
    return (
      <BackgroundGradient>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </BackgroundGradient>
    );
  }

  if (!isAuthenticated) {
    return (
      <BackgroundGradient>
        <Stack
          screenOptions={{
            headerShown: false,
            headerBackTitle: 'Back',
            contentStyle: { backgroundColor: 'transparent' },
          }}
          initialRouteName="(auth)"
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack>
      </BackgroundGradient>
    );
  }

  return (
    <BackgroundGradient>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthenticatedApp />
      </GestureHandlerRootView>
    </BackgroundGradient>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AuthProvider>
          <SearchProvider>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <RootLayoutNav />
          </SearchProvider>
        </AuthProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
