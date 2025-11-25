import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/hooks/auth-context";
import { PostsProvider } from "@/hooks/posts-context";
import { SearchProvider } from "@/hooks/search-context";
import { FollowProvider } from "@/hooks/follow-context";
import { NotificationProvider } from "@/hooks/notifications-context";
import { MessagesProvider } from "@/hooks/messages-context";
import { UsersProvider } from "@/hooks/users-context";
import { OpportunitiesProvider } from "@/hooks/opportunities-context";
import { ScoutingProvider } from "@/hooks/scouting-context";
import { AnalyticsProvider } from "@/hooks/analytics-context";
import { View, ActivityIndicator, StatusBar, Platform, useColorScheme, StyleSheet, LogBox } from "react-native";
import ErrorBoundary from "@/components/ErrorBoundary";
import { theme } from "@/constants/theme";
import { BackgroundGradient } from "@/components/BackgroundGradient";
import { useNetworkErrorHandler } from "@/hooks/network-error-handler";

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore errors from splash screen
});

if (Platform.OS === 'web') {
  const originalError = console.error;
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Unable to activate keep awake') ||
        args[0].includes('expo-keep-awake'))
    ) {
      return;
    }
    originalError.apply(console, args);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      if (
        event.reason?.message?.includes('Unable to activate keep awake') ||
        event.reason?.message?.includes('expo-keep-awake')
      ) {
        event.preventDefault();
        return;
      }
    });
  }
}

LogBox.ignoreLogs([
  'Unable to activate keep awake',
  'expo-keep-awake',
]);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on update errors
        if (error instanceof Error && 
            (error.message.includes('Remote update request') || 
             error.message.includes('java.io.IOException'))) {
          return false;
        }
        // Retry other errors up to 3 times
        return failureCount < 3;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();

  console.log('RootLayoutNav: isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  if (isLoading) {
    return (
      <BackgroundGradient>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </BackgroundGradient>
    );
  }

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }} initialRouteName={isAuthenticated ? "(tabs)" : "(auth)"}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="edit-profile" options={{ title: "Edit Profile", presentation: "modal" }} />
      <Stack.Screen name="settings" options={{ title: "Settings", presentation: "modal" }} />
      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
      <Stack.Screen name="user/[id]" options={{ title: "Profile" }} />
      <Stack.Screen name="chat" options={{ headerShown: false }} />
    </Stack>
  );
}

const AppProviders = React.memo(({ children }: { children: React.ReactNode }) => {
  const colorScheme = useColorScheme();
  const barStyle = useMemo<'light-content' | 'dark-content'>(() => (
    colorScheme === 'dark' ? 'light-content' : 'dark-content'
  ), [colorScheme]);

  return (
    <AuthProvider>
      <SearchProvider>
        <NotificationProvider>
          <FollowProvider>
            <MessagesProvider>
              <OpportunitiesProvider>
                <UsersProvider>
                  <PostsProvider>
                    <GestureHandlerRootView style={styles.flex} testID="app-root">
                      <StatusBar
                        barStyle={barStyle}
                        translucent
                        backgroundColor={Platform.OS === 'android' ? 'transparent' : 'transparent'}
                      />
                      <ScoutingProvider>
                        <AnalyticsProvider>
                          {children}
                        </AnalyticsProvider>
                      </ScoutingProvider>
                    </GestureHandlerRootView>
                  </PostsProvider>
                </UsersProvider>
              </OpportunitiesProvider>
            </MessagesProvider>
          </FollowProvider>
        </NotificationProvider>
      </SearchProvider>
    </AuthProvider>
  );
});

AppProviders.displayName = 'AppProviders';

export default function RootLayout() {
  useNetworkErrorHandler();
  
  useEffect(() => {
    let isMounted = true;
    const hide = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch {
      }
    };
    const timeout = setTimeout(() => {
      if (isMounted) {
        SplashScreen.hideAsync().catch(() => {});
      }
    }, 2000);

    hide();

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AppProviders>
          <RootLayoutNav />
        </AppProviders>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flex: {
    flex: 1,
  },
});