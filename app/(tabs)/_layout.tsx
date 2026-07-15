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
} from 'lucide-react-native';
import React from 'react';
import { TouchableOpacity, View, Platform } from 'react-native';

const Haptics = Platform.OS !== 'web' ? require('expo-haptics') : null;
import { useAuth } from '@/hooks/auth-context';
import { theme, roleAccents } from '@/constants/theme';
import { useMessages } from '@/hooks/messages-context';
import { useNotifications } from '@/hooks/notifications-context';
import { UserRole } from '@/types';

// Role-specific tab labels
// Keep labels ≤8 chars: 7 tabs at 375px leave ~44px of label width each,
// so "DASHBOARD" ellipsized ("DASHB…"). The dashboard screens keep their
// in-page titles; the tab is just the way home.
const HOME_LABELS: Partial<Record<UserRole, string>> = {
  athlete: 'Feed',
  scout: 'Home',
  coach: 'Coach HQ',
  team: 'Home',
  academy: 'Home',
  fan: 'Feed',
  brand: 'Talent',
  trainer: 'Hub',
  gym: 'Home',
};

const DISCOVER_LABELS: Partial<Record<UserRole, string>> = {
  scout: 'Search',
  fan: 'Explore',
  // 'Discover' (8 chars) ellipsizes in the 7-tab bar at 375px; the
  // magnifier icon + 'Search' is the stronger convention anyway.
  athlete: 'Search',
  coach: 'Search',
  team: 'Search',
  academy: 'Search',
  brand: 'Search',
  trainer: 'Search',
  gym: 'Search',
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
          paddingBottom: 6,
          paddingTop: 6,
          // 56 clipped the 40px Create circle + label; labels lost their
          // descenders and read as cut off at the viewport bottom.
          height: 64,
          shadowOpacity: 0,
          elevation: 0,
        },
        // 7 tabs at 375px leave ~54px per slot; the default ~10px label
        // margin ellipsized 8-char labels ("DISCO…", "MESSA…")
        tabBarItemStyle: {
          padding: 0,
          paddingHorizontal: 0,
        },
        tabBarLabelStyle: {
          // 8px (not 9) + no letterSpacing: react-navigation reserves ~10px
          // of the ~54px slot, and 8-char labels ellipsized at 9px
          // ("DISCO…", "MESSA…")
          fontSize: 8,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0,
          marginHorizontal: 0,
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
          tabPress: () => Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Light),
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
          // 'Messages' ellipsizes at 375px; page header matches 'Chats'
          title: 'Chats',
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
