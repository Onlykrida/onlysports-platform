import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { 
  User, 
  Bell, 
  Shield, 
  HelpCircle, 
  Info, 
  LogOut, 
  ChevronRight,
  Moon,
  Globe,
  Trash2,
  Download,
  Share2,
  Database
} from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/auth-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  showSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  danger?: boolean;
}

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);


  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const notifications = await AsyncStorage.getItem('notifications_enabled');
      const darkMode = await AsyncStorage.getItem('dark_mode_enabled');
      
      if (notifications !== null) {
        setNotificationsEnabled(JSON.parse(notifications));
      }
      if (darkMode !== null) {
        setDarkModeEnabled(JSON.parse(darkMode));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (key: string, value: boolean) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    await saveSettings('notifications_enabled', value);
    
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Notifications',
        value ? 'Notifications enabled' : 'Notifications disabled'
      );
    }
  };

  const handleDarkModeToggle = async (value: boolean) => {
    setDarkModeEnabled(value);
    await saveSettings('dark_mode_enabled', value);
    
    Alert.alert(
      'Theme',
      value ? 'Dark mode enabled (restart app to apply)' : 'Light mode enabled (restart app to apply)'
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'This feature will export your profile data, achievements, and stats.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export', 
          onPress: () => {
            Alert.alert('Success', 'Data export will be available soon!');
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Account Deletion', 'Please contact support to delete your account.');
          }
        }
      ]
    );
  };

  const handleContactSupport = () => {
    const email = 'support@sportsapp.com';
    const subject = 'Support Request';
    const body = `Hi Support Team,\\n\\nI need help with:\\n\\n[Please describe your issue]\\n\\nUser ID: ${user?.id}\\nEmail: ${user?.email}`;
    
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.canOpenURL(mailtoUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(mailtoUrl);
        } else {
          Alert.alert(
            'Contact Support',
            `Please email us at: ${email}\\n\\nOr copy this email address to your clipboard.`,
            [
              { text: 'OK' },
              { 
                text: 'Copy Email', 
                onPress: () => {
                  if (Platform.OS !== 'web') {
                    Alert.alert('Copied', 'Email address copied to clipboard');
                  }
                }
              }
            ]
          );
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Unable to open email client');
      });
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/welcome');
          }
        }
      ]
    );
  };

  const settingSections: { title: string; items: SettingItem[] }[] = [
    {
      title: 'Account',
      items: [
        {
          id: 'edit-profile',
          title: 'Edit Profile',
          subtitle: 'Update your personal information',
          icon: <User size={20} color={theme.colors.text} />,
          onPress: () => router.push('/edit-profile'),
          showChevron: true,
        },
        {
          id: 'privacy',
          title: 'Privacy & Security',
          subtitle: 'Manage your privacy settings',
          icon: <Shield size={20} color={theme.colors.text} />,
          onPress: () => Alert.alert('Coming Soon', 'Privacy settings will be available soon'),
          showChevron: true,
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          id: 'notifications',
          title: 'Push Notifications',
          subtitle: 'Receive updates and alerts',
          icon: <Bell size={20} color={theme.colors.text} />,
          showSwitch: true,
          switchValue: notificationsEnabled,
          onSwitchChange: handleNotificationToggle,
        },
        {
          id: 'dark-mode',
          title: 'Dark Mode',
          subtitle: 'Switch to dark theme',
          icon: <Moon size={20} color={theme.colors.text} />,
          showSwitch: true,
          switchValue: darkModeEnabled,
          onSwitchChange: handleDarkModeToggle,
        },
        {
          id: 'language',
          title: 'Language',
          subtitle: 'English',
          icon: <Globe size={20} color={theme.colors.text} />,
          onPress: () => Alert.alert('Coming Soon', 'Language settings will be available soon'),
          showChevron: true,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          title: 'Help & Support',
          subtitle: 'Get help and contact support',
          icon: <HelpCircle size={20} color={theme.colors.text} />,
          onPress: handleContactSupport,
          showChevron: true,
        },
        {
          id: 'about',
          title: 'About',
          subtitle: 'App version and information',
          icon: <Info size={20} color={theme.colors.text} />,
          onPress: () => Alert.alert('About', 'Sports Connect v1.0.0\\nBuilt with React Native'),
          showChevron: true,
        },
      ],
    },
    {
      title: 'Data & Privacy',
      items: [
        {
          id: 'export-data',
          title: 'Export Data',
          subtitle: 'Download your profile data',
          icon: <Download size={20} color={theme.colors.text} />,
          onPress: handleExportData,
          showChevron: true,
        },
        {
          id: 'share-profile',
          title: 'Share Profile',
          subtitle: 'Share your profile with others',
          icon: <Share2 size={20} color={theme.colors.text} />,
          onPress: () => Alert.alert('Share Profile', 'Profile sharing will be available soon!'),
          showChevron: true,
        },
      ],
    },
    {
      title: 'Developer',
      items: [
        {
          id: 'team-management',
          title: 'Team Management',
          subtitle: 'Manage your team and academy',
          icon: <Database size={20} color={theme.colors.primary} />,
          onPress: () => router.push('/team'),
          showChevron: true,
        },
      ],
    },
    {
      title: 'Account Actions',
      items: [
        {
          id: 'delete-account',
          title: 'Delete Account',
          subtitle: 'Permanently delete your account',
          icon: <Trash2 size={20} color={theme.colors.danger} />,
          onPress: handleDeleteAccount,
          showChevron: true,
          danger: true,
        },
        {
          id: 'logout',
          title: 'Logout',
          subtitle: 'Sign out of your account',
          icon: <LogOut size={20} color={theme.colors.danger} />,
          onPress: handleLogout,
          showChevron: true,
          danger: true,
        },
      ],
    },
  ];

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.settingItem, item.danger && styles.dangerItem]}
      onPress={item.onPress}
      disabled={!item.onPress && !item.showSwitch}
    >
      <View style={styles.settingIcon}>
        {item.icon}
      </View>
      
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, item.danger && styles.dangerText]}>
          {item.title}
        </Text>
        {item.subtitle && (
          <Text style={styles.settingSubtitle}>
            {item.subtitle}
          </Text>
        )}
      </View>

      <View style={styles.settingAction}>
        {item.showSwitch && (
          <Switch
            value={item.switchValue}
            onValueChange={item.onSwitchChange}
            trackColor={{ 
              false: theme.colors.border, 
              true: theme.colors.primary + '40' 
            }}
            thumbColor={item.switchValue ? theme.colors.primary : theme.colors.surface}
          />
        )}
        {item.showChevron && (
          <ChevronRight 
            size={20} 
            color={item.danger ? theme.colors.danger : theme.colors.textSecondary} 
          />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Settings',
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTitleStyle: {
            color: theme.colors.text,
          },
        }}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Info Header */}
        <View style={styles.userHeader}>
          <View style={styles.userAvatar}>
            <Text style={styles.userInitial}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.userRole}>{user?.role || 'Athlete'}</Text>
          </View>
        </View>

        {/* Settings Sections */}
        {settingSections.map((section, sectionIndex) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <View key={item.id}>
                  {renderSettingItem(item)}
                  {itemIndex < section.items.length - 1 && (
                    <View style={styles.separator} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* App Version */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
          <Text style={styles.copyrightText}>© 2024 Sports Connect</Text>
          <Text style={styles.buildText}>Build: {Platform.OS === 'web' ? 'Web' : 'Mobile'}</Text>
          <TouchableOpacity 
            style={styles.feedbackButton}
            onPress={() => Alert.alert('Feedback', 'Thank you for your interest! Feedback system coming soon.')}
          >
            <Text style={styles.feedbackText}>Send Feedback</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.md,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  userInitial: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  userEmail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  userRole: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  sectionContent: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    minHeight: 60,
  },
  dangerItem: {
    backgroundColor: theme.colors.surface,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  dangerText: {
    color: theme.colors.danger,
  },
  settingSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  settingAction: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: 68,
  },
  footer: {
    alignItems: 'center',
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  versionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  copyrightText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  buildText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  feedbackButton: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.borderRadius.md,
  },
  feedbackText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
});