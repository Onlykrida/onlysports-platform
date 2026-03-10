import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/hooks/auth-context";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { PostsProvider } from "@/hooks/posts-context";
import { SearchProvider } from "@/hooks/search-context";
import { FollowProvider } from "@/hooks/follow-context";
import { NotificationProvider } from "@/hooks/notifications-context";
import { MessagesProvider } from "@/hooks/messages-context";
import { GroupsProvider } from "@/hooks/group-messages-context";
import { UsersProvider } from "@/hooks/users-context";
import { OpportunitiesProvider } from "@/hooks/opportunities-context";
import { View, ActivityIndicator, StatusBar } from "react-native";
import { ScoutingProvider } from "@/hooks/scouting-context";
import ErrorBoundary from "@/components/ErrorBoundary";
import { theme } from "@/constants/theme";
import { BackgroundGradient } from "@/components/BackgroundGradient";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function PushNotificationRegistrar() {
  // Only registers when user is authenticated (useAuth inside usePushNotifications)
  usePushNotifications();
  return null;
}

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();

  if (__DEV__) console.log("RootLayoutNav: isAuthenticated:", isAuthenticated, "isLoading:", isLoading);

  if (isLoading) {
    return (
      <BackgroundGradient>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </BackgroundGradient>
    );
  }

  return (
    <BackgroundGradient>
      {isAuthenticated && <PushNotificationRegistrar />}
      <Stack
        screenOptions={{
          headerBackTitle: "Back",
          contentStyle: { backgroundColor: "transparent" },
        }}
        initialRouteName={isAuthenticated ? "(tabs)" : "(auth)"}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="edit-profile" options={{ title: "Edit Profile", presentation: "modal" }} />
        <Stack.Screen name="settings" options={{ title: "Settings", presentation: "modal" }} />
        <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
        <Stack.Screen name="user/[id]" options={{ title: "Profile" }} />
        <Stack.Screen name="team-dashboard" options={{ title: "Team Dashboard", headerShown: false }} />
        <Stack.Screen name="chat" options={{ headerShown: false }} />
      </Stack>
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
          <NotificationProvider>
            <FollowProvider>
              <MessagesProvider>
                <GroupsProvider>
                <OpportunitiesProvider>
                  <UsersProvider>
                    <PostsProvider>
                      <GestureHandlerRootView style={{ flex: 1 }}>
                        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
                        <ScoutingProvider>
                          <RootLayoutNav />
                        </ScoutingProvider>
                      </GestureHandlerRootView>
                    </PostsProvider>
                  </UsersProvider>
                </OpportunitiesProvider>
              </GroupsProvider>
              </MessagesProvider>
            </FollowProvider>
          </NotificationProvider>
        </SearchProvider>
      </AuthProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}