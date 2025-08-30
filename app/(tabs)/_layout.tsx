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
        tabBarActiveTintColor: theme.colors.primary, // Electric Blue for active tabs
        tabBarInactiveTintColor: theme.colors.textMuted, // Muted grey for inactive
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface, // Dark surface
          borderTopWidth: 2,
          borderTopColor: theme.colors.primary, // Electric Blue border
          paddingBottom: 8,
          paddingTop: 8,
          height: 75, // Slightly taller for sporty feel
          ...theme.shadow.electric, // Electric blue glow for tab bar
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: theme.fontWeight.extrabold, // Bold sporty text
          textTransform: 'uppercase' as const,
          letterSpacing: 0.8, // More spacing for sporty feel
        },
        tabBarItemStyle: {
          paddingVertical: 6,
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
                  backgroundColor: theme.colors.orange, // Orange for notifications
                  borderRadius: 12,
                  minWidth: 22,
                  height: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 6,
                  ...theme.shadow.notification, // Orange glow for notification badges
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
                  backgroundColor: theme.colors.orange, // Orange for notifications
                  borderRadius: 12,
                  minWidth: 22,
                  height: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 6,
                  ...theme.shadow.notification, // Orange glow for notification badges
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