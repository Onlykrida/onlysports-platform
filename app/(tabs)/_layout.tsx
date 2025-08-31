import { Slot, useRouter, useSegments } from "expo-router";
import { Home, Search, Briefcase, User, PlusCircle, MessageCircle, Bell } from "lucide-react-native";
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from "react-native";
import { theme } from "@/constants/theme";
import { useMessages } from "@/hooks/messages-context";
import { useNotifications } from "@/hooks/notifications-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = Platform.OS === 'web' ? 280 : 80;

interface TabItem {
  name: string;
  title: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  route: string;
}

export default function TabLayout() {
  const { conversations } = useMessages();
  const { unreadCount } = useNotifications();
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  
  const unreadMessagesCount = conversations.reduce((total, conv) => total + conv.unreadCount, 0);
  
  const currentRoute = segments[segments.length - 1] || '(home)';
  
  const tabs: TabItem[] = [
    { name: '(home)', title: 'Feed', icon: Home, route: '/' },
    { name: 'discover', title: 'Discover', icon: Search, route: '/discover' },
    { name: 'create', title: 'Create', icon: PlusCircle, route: '/create' },
    { name: 'opportunities', title: 'Opportunities', icon: Briefcase, route: '/opportunities' },
    { name: 'messages', title: 'Messages', icon: MessageCircle, route: '/messages' },
    { name: 'notifications', title: 'Notifications', icon: Bell, route: '/notifications' },
    { name: 'profile', title: 'Profile', icon: User, route: '/profile' },
  ];
  
  const handleTabPress = (route: string) => {
    router.push(route as any);
  };
  
  const renderNotificationBadge = (count: number) => {
    if (count === 0) return null;
    
    return (
      <View style={[
        styles.notificationBadge,
        { backgroundColor: theme.colors.orange },
        theme.shadow.notification
      ]}>
        <Text style={[
          styles.notificationText,
          { color: theme.colors.white, fontWeight: theme.fontWeight.black }
        ]}>
          {count > 99 ? '99+' : count}
        </Text>
      </View>
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Left Sidebar */}
      <View style={[
        styles.sidebar,
        {
          backgroundColor: theme.colors.surface,
          borderRightColor: theme.colors.primary,
          paddingTop: insets.top,
          width: SIDEBAR_WIDTH,
        },
        theme.shadow.electric
      ]}>
        {/* App Logo/Title */}
        <View style={styles.logoContainer}>
          <Text style={[
            styles.logoText,
            {
              color: theme.colors.primary,
              fontSize: Platform.OS === 'web' ? theme.fontSize.xl : theme.fontSize.lg,
              fontWeight: theme.fontWeight.black,
            }
          ]}>
            {Platform.OS === 'web' ? 'ONLYSPORTS' : 'OS'}
          </Text>
        </View>
        
        {/* Navigation Items */}
        <View style={styles.navContainer}>
          {tabs.map((tab) => {
            const isActive = currentRoute === tab.name || 
                           (tab.name === '(home)' && (currentRoute === 'index' || !currentRoute));
            const IconComponent = tab.icon;
            
            return (
              <TouchableOpacity
                key={tab.name}
                style={[
                  styles.navItem,
                  {
                    backgroundColor: isActive ? theme.colors.primary : 'transparent',
                    borderRadius: theme.borderRadius.md,
                  },
                  isActive && theme.shadow.electric
                ]}
                onPress={() => handleTabPress(tab.route)}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <IconComponent
                    size={24}
                    color={isActive ? theme.colors.white : theme.colors.textMuted}
                  />
                  
                  {/* Notification badges */}
                  {tab.name === 'messages' && renderNotificationBadge(unreadMessagesCount)}
                  {tab.name === 'notifications' && renderNotificationBadge(unreadCount)}
                </View>
                
                {Platform.OS === 'web' && (
                  <Text style={[
                    styles.navLabel,
                    {
                      color: isActive ? theme.colors.white : theme.colors.textMuted,
                      fontWeight: isActive ? theme.fontWeight.bold : theme.fontWeight.medium,
                      fontSize: theme.fontSize.sm,
                    }
                  ]}>
                    {tab.title}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      
      {/* Main Content */}
      <View style={[
        styles.content,
        {
          marginLeft: SIDEBAR_WIDTH,
          backgroundColor: theme.colors.background,
        }
      ]}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 1000,
    borderRightWidth: 2,
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  logoContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
  },
  logoText: {
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  navContainer: {
    flex: 1,
    gap: 8,
  },
  navItem: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Platform.OS === 'web' ? 16 : 8,
    gap: Platform.OS === 'web' ? 12 : 4,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  notificationText: {
    fontSize: 10,
  },
  content: {
    flex: 1,
  },
});