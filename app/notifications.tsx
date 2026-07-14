import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import {
  Heart,
  MessageCircle,
  UserPlus,
  FileText,
  Briefcase,
  Check,
  Trash2,
  Bell,
  Eye,
  AtSign,
  Settings,
  UserCheck,
  ClipboardCheck,
} from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { formatDate } from '@/constants/format-date';
import { Notification } from '@/types';
import { useNotifications } from '@/hooks/notifications-context';
import { FLATLIST_PERF_PROPS } from '@/constants/performance';

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'follow':
      return <UserPlus size={20} color={theme.colors.primary} />;
    case 'like':
      return <Heart size={20} color={theme.colors.danger} />;
    case 'comment':
      return <MessageCircle size={20} color={theme.colors.secondary} />;
    case 'post':
      return <FileText size={20} color={theme.colors.accent} />;
    case 'opportunity':
      return <Briefcase size={20} color={theme.colors.warning} />;
    case 'message':
      return <MessageCircle size={20} color={theme.colors.primary} />;
    case 'connection_request':
      return <UserPlus size={20} color={theme.colors.secondary} />;
    case 'connection_accepted':
      return <UserCheck size={20} color={theme.colors.success} />;
    case 'profile_view':
      return <Eye size={20} color={theme.colors.secondary} />;
    case 'mention':
      return <AtSign size={20} color={theme.colors.accent} />;
    case 'application':
      return <FileText size={20} color={theme.colors.warning} />;
    case 'coach_verification_request':
      return <ClipboardCheck size={20} color={theme.colors.success} />;
    case 'system':
      return <Settings size={20} color={theme.colors.textSecondary} />;
    default:
      return <Bell size={20} color={theme.colors.textSecondary} />;
  }
};

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return formatDate(date);
};

export default function NotificationsScreen() {
  const {
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  } = useNotifications();

  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      if (!notification.read) {
        markAsRead(notification.id);
      }
      // Verification flow deep-links — three types from the verification work:
      //   verification_request → verifier taps → /verify-result
      //   verification_approved/rejected → athlete taps → fitness history
      // The notification data jsonb carries the IDs needed by each target.
      if (notification.type === 'verification_request' && notification.data) {
        router.push({
          pathname: '/verify-result' as any,
          params: {
            requestId: String(notification.data.request_id ?? ''),
            testResultId: String(notification.data.test_result_id ?? ''),
            athleteName: String(notification.data.athlete_name ?? ''),
            athleteAvatar: String(notification.data.athlete_avatar ?? ''),
          },
        });
        return;
      }
      if (
        notification.type === 'verification_approved' ||
        notification.type === 'verification_rejected'
      ) {
        // Land athlete on their fitness history so they can see the verified
        // result (or where to retry after rejection).
        router.push('/beep-test-history' as any);
        return;
      }
      // Legacy 'coach_verification_request' kept for any in-flight rows
      if (notification.type === 'coach_verification_request' && notification.data) {
        router.push({ pathname: '/verify-result' as any, params: notification.data });
        return;
      }
      switch (notification.type) {
        case 'like':
        case 'comment':
        case 'post':
          if (notification.data?.postId) {
            router.push({
              pathname: '/post/[id]' as any,
              params: { id: String(notification.data.postId) },
            });
          }
          break;
        case 'follow':
        case 'connection_request':
        case 'connection_accepted':
        case 'profile_view':
          if (notification.data?.followerId || notification.data?.userId) {
            router.push({
              pathname: '/user/[id]' as any,
              params: { id: String(notification.data.followerId || notification.data.userId) },
            });
          }
          break;
        case 'message':
          if (notification.data?.senderId) {
            router.push({
              pathname: '/chat/[id]' as any,
              params: { id: String(notification.data.senderId) },
            });
          }
          break;
        case 'opportunity':
        case 'application':
          router.push('/(tabs)/opportunities' as any);
          break;
        default:
          break;
      }
    },
    [markAsRead],
  );

  const renderNotification = useCallback(
    ({ item }: { item: Notification }) => (
      <TouchableOpacity
        style={[styles.notificationItem, !item.read && styles.unreadNotification]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.notificationIcon}>{getNotificationIcon(item.type)}</View>

        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          <Text style={styles.notificationTime}>{formatTimeAgo(item.createdAt)}</Text>
        </View>

        <View style={styles.notificationActions}>
          {!item.read && (
            <TouchableOpacity style={styles.actionButton} onPress={() => markAsRead(item.id)}>
              <Check size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionButton} onPress={() => deleteNotification(item.id)}>
            <Trash2 size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    ),
    [handleNotificationPress, markAsRead, deleteNotification],
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Bell size={48} color={theme.colors.textSecondary} />
      <Text style={styles.emptyTitle}>No notifications yet</Text>
      <Text style={styles.emptyMessage}>
        You&apos;ll see notifications here when people interact with your content
      </Text>
    </View>
  );

  if (isLoading && notifications.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Notifications',
            headerShown: true,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity onPress={markAllAsRead} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>Mark all read</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.emptyListContent,
        ]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshNotifications}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        {...FLATLIST_PERF_PROPS}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  headerButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  headerButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  listContent: {
    paddingVertical: theme.spacing.sm,
  },
  emptyListContent: {
    flex: 1,
  },
  notificationItem: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  unreadNotification: {
    backgroundColor: theme.colors.primaryLight,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: theme.spacing.xs,
  },
  notificationTime: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  notificationActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    padding: theme.spacing.xs,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyMessage: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

const NotificationSeparator = () => <View style={styles.separator} />;
