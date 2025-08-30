import { Tabs } from "expo-router";
import { Home, Search, Briefcase, User, PlusCircle, MessageCircle, Bell } from "lucide-react-native";
import React from "react";
import { View, Text } from "react-native";
import { theme } from "@/constants/theme";
import { useMessages } from "@/hooks/messages-context";
import { useNotifications } from "@/hooks/notifications-context";

export default function TabLayout() {
  const { conversations } = useMessages();
  const { unreadCount } = useNotifications();
  
  const unreadMessagesCount = conversations.reduce((total, conv) => total + conv.unreadCount, 0);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 2,
          borderTopColor: theme.colors.primary,
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
          ...theme.shadow.glow,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: theme.fontWeight.bold,
          textTransform: 'uppercase' as const,
          letterSpacing: 0.5,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Feed",
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarIcon: ({ color }) => <Search size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: ({ color }) => <PlusCircle size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="opportunities"
        options={{
          title: "Opportunities",
          tabBarIcon: ({ color }) => <Briefcase size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color }) => (
            <View style={{ position: 'relative' }}>
              <MessageCircle size={24} color={color} />
              {unreadMessagesCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  backgroundColor: theme.colors.accent,
                  borderRadius: 12,
                  minWidth: 22,
                  height: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 6,
                  ...theme.shadow.fire,
                }}>
                  <Text style={{
                    color: theme.colors.white,
                    fontSize: 10,
                    fontWeight: theme.fontWeight.black,
                  }}>
                    {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: ({ color }) => (
            <View style={{ position: 'relative' }}>
              <Bell size={24} color={color} />
              {unreadCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  backgroundColor: theme.colors.accent,
                  borderRadius: 12,
                  minWidth: 22,
                  height: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 6,
                  ...theme.shadow.fire,
                }}>
                  <Text style={{
                    color: theme.colors.white,
                    fontSize: 10,
                    fontWeight: theme.fontWeight.black,
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}