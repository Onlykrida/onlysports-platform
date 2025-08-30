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
import { View, ActivityIndicator } from "react-native";
import { ScoutingProvider } from "@/hooks/scouting-context";
import ErrorBoundary from "@/components/ErrorBoundary";
import { theme } from "@/constants/theme";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();

  console.log('RootLayoutNav: isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
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
  useEffect(() => {
    SplashScreen.hideAsync();
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