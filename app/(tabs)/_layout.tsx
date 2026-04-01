import { Tabs, router } from 'expo-router';
import {
  Home,
  Search,
  Briefcase,
  User,
  PlusCircle,
  MessageCircle,
  Bell,
  Plus,
  Sparkles,
} from 'lucide-react-native';
import React, { useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/hooks/auth-context';
import { theme, roleAccents } from '@/constants/theme';
import { useMessages } from '@/hooks/messages-context';
import { useNotifications } from '@/hooks/notifications-context';
import { UserRole } from '@/types';

// Role-specific tab labels
const HOME_LABELS: Partial<Record<UserRole, string>> = {
  athlete: 'Feed',
  scout: 'Dashboard',
  coach: 'Coach HQ',
  team: 'Dashboard',
  academy: 'Dashboard',
  fan: 'Feed',
  brand: 'Talent',
  trainer: 'Hub',
  gym: 'Dashboard',
};

const DISCOVER_LABELS: Partial<Record<UserRole, string>> = {
  scout: 'Search',
  fan: 'Explore',
};

export default function TabLayout() {
  const messagesCtx = useMessages();
  const notificationsCtx = useNotifications();
  const { user } = useAuth();

  const conversations = messagesCtx?.conversations ?? [];
  const unreadCount = notificationsCtx?.unreadCount ?? 0;

  const role = (user?.role || 'athlete') as UserRole;
  const accent = roleAccents[role] || roleAccents.athlete;

  // Role-based tab visibility
  const hideCreate = role === 'fan' || role === 'scout';
  const hideOpps = role === 'fan';

  const unreadMessagesCount = conversations.reduce((total, conv) => total + conv.unreadCount, 0);

  const getTabBarBadge = (count: number) => {
    if (count === 0) return undefined;
    return count > 99 ? '99+' : count.toString();
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: accent.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: '#0a0a0a',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.06)',
          paddingBottom: 4,
          paddingTop: 6,
          height: 56,
          shadowOpacity: 0,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        tabBarBadgeStyle: {
          backgroundColor: theme.colors.orange,
          color: '#0a0a0a',
          fontWeight: '800',
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: HOME_LABELS[role] || 'Feed',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: DISCOVER_LABELS[role] || 'Discover',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          href: hideCreate ? null : undefined,
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: focused ? accent.accent : accent.accentBg,
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: -4,
              }}
            >
              <PlusCircle size={22} color={focused ? '#0a0a0a' : accent.accent} />
            </View>
          ),
        }}
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />
      <Tabs.Screen
        name="opportunities"
        options={{
          title: 'Opps',
          href: hideOpps ? null : undefined,
          tabBarIcon: ({ color, size }) => <Briefcase size={size} color={color} />,
          headerShown: true,
          headerStyle: { backgroundColor: theme.colors.surfaceDark },
          headerTitleStyle: { color: theme.colors.text, fontWeight: '700' },
          headerTintColor: theme.colors.text,
          headerShadowVisible: false,
          headerRight: () => {
            const canCreateOpportunity =
              role === 'coach' ||
              role === 'scout' ||
              role === 'team' ||
              role === 'gym' ||
              role === 'brand' ||
              role === 'academy';
            return canCreateOpportunity ? (
              <TouchableOpacity
                style={{ marginRight: theme.spacing.md }}
                onPress={() => router.push('/opportunities/create')}
                testID="create-opportunity-button"
              >
                <Plus size={24} color={accent.accent} />
              </TouchableOpacity>
            ) : null;
          },
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
          title: 'Alerts',
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
