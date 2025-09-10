import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/hooks/auth-context";
import { PostsProvider } from "@/hooks/posts-context";
import { SearchProvider } from "@/hooks/search-context";
import { FollowProvider } from "@/hooks/follow-context";
import { NotificationProvider } from "@/hooks/notifications-context";
import { MessagesProvider } from "@/hooks/messages-context";
import { UsersProvider } from "@/hooks/users-context";
import { OpportunitiesProvider } from "@/hooks/opportunities-context";
import { View, ActivityIndicator, StatusBar, Platform } from "react-native";
import { ScoutingProvider } from "@/hooks/scouting-context";
import ErrorBoundary from "@/components/ErrorBoundary";
import { theme } from "@/constants/theme";
import BackgroundGradient from "@/components/BackgroundGradient";
import { useNetworkErrorHandler } from "@/hooks/network-error-handler";

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore errors from splash screen
});

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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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

export default function RootLayout() {
  // Set up network error handler
  useNetworkErrorHandler();
  
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {
      // Ignore errors from splash screen
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
      <AuthProvider>
        <SearchProvider>
          <NotificationProvider>
            <FollowProvider>
              <MessagesProvider>
                <OpportunitiesProvider>
                  <UsersProvider>
                    <PostsProvider>
                      <GestureHandlerRootView style={{ flex: 1 }}>
                        <StatusBar barStyle="light-content" backgroundColor={theme.colors.surface} translucent={Platform.OS === 'ios'} />
                        <ScoutingProvider>
                          <RootLayoutNav />
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
      </ErrorBoundary>
    </QueryClientProvider>
  );
}