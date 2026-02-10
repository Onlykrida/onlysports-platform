import { Tabs, router } from "expo-router";
import { Home, Search, Briefcase, User, PlusCircle, MessageCircle, Bell, Plus, Trophy, Users } from "lucide-react-native";
import React from "react";
import { TouchableOpacity } from "react-native";
import { useAuth } from "@/hooks/auth-context";
import { theme } from "@/constants/theme";
import { useMessages } from "@/hooks/messages-context";
import { useNotifications } from "@/hooks/notifications-context";

export default function TabLayout() {
  const { conversations } = useMessages();
  const { unreadCount } = useNotifications();
  const { user } = useAuth();
  
  const unreadMessagesCount = conversations.reduce((total, conv) => total + conv.unreadCount, 0);
  
  const getTabBarBadge = (count: number) => {
    if (count === 0) return undefined;
    return count > 99 ? '99+' : count.toString();
  };
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarBadgeStyle: {
          backgroundColor: theme.colors.danger,
        },
      }}
    >
      <Tabs.Screen
        name="opportunities"
        options={{
          title: 'Opportunities',
          tabBarIcon: ({ color, size }) => <Briefcase size={size} color={color} />,
          headerShown: true,
          headerStyle: { backgroundColor: theme.colors.surfaceDark },
          headerTitleStyle: { color: theme.colors.text, fontWeight: '700' },
          headerTintColor: theme.colors.text,
          headerShadowVisible: false,
          headerRight: () => {
            return (user?.role === 'coach' || user?.role === 'scout' || user?.role === 'team') ? (
              <TouchableOpacity 
                style={{ marginRight: theme.spacing.md }}
                onPress={() => router.push('/opportunities/create' as any)}
              >
                <Plus size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            ) : null;
          }
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Talent',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Post',
          tabBarIcon: ({ color, size }) => <PlusCircle size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => <Trophy size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
          tabBarBadge: getTabBarBadge(unreadMessagesCount),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
          tabBarBadge: getTabBarBadge(unreadCount),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
