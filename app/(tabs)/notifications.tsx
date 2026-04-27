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
import { BackgroundGradient } from '@/components/BackgroundGradient';
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
} from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { FLATLIST_PERF_PROPS } from '@/constants/performance';
import { Notification } from '@/types';
import { useNotifications } from '@/hooks/notifications-context';
import { router } from 'expo-router';

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'follow':
      return <UserPlus size={18} color={theme.colors.primary} />;
    case 'like':
      return <Heart size={18} color={theme.colors.danger} />;
    case 'comment':
      return <MessageCircle size={18} color={theme.colors.secondary} />;
    case 'post':
      return <FileText size={18} color={theme.colors.accent} />;
    case 'opportunity':
      return <Briefcase size={18} color={theme.colors.warning} />;
    case 'message':
      return <MessageCircle size={18} color={theme.colors.primary} />;
    case 'connection_request':
      return <UserPlus size={18} color={theme.colors.secondary} />;
    case 'connection_accepted':
      return <UserCheck size={18} color={theme.colors.success} />;
    case 'profile_view':
      return <Eye size={18} color={theme.colors.secondary} />;
    case 'mention':
      return <AtSign size={18} color={theme.colors.accent} />;
    case 'application':
      return <FileText size={18} color={theme.colors.warning} />;
    case 'system':
      return <Settings size={18} color={theme.colors.textSecondary} />;
    default:
      return <Bell size={18} color={theme.colors.textSecondary} />;
  }
};

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString();
};

const handleNotificationPress = (notification: Notification) => {
  // Verification flow deep-links — see verification work in commit history
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
    router.push('/beep-test-history' as any);
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
};

export default function NotificationsTab() {
  const {
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  } = useNotifications();

  const renderNotification = useCallback(
    ({ item }: { item: Notification }) => (
      <TouchableOpacity
        style={[styles.notificationItem, !item.read && styles.unreadNotification]}
        onPress={() => {
          if (!item.read) {
            markAsRead(item.id);
          }
          handleNotificationPress(item);
        }}
      >
        <View style={styles.notificationIcon}>{getNotificationIcon(item.type)}</View>

        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle} numberOfLines={1} ellipsizeMode="tail">
            {item.title}
          </Text>
          <Text style={styles.notificationMessage} numberOfLines={2} ellipsizeMode="tail">
            {item.message}
          </Text>
          <Text style={styles.notificationTime} numberOfLines={1} ellipsizeMode="tail">
            {formatTimeAgo(item.createdAt)}
          </Text>
        </View>

        <View style={styles.notificationActions}>
          {!item.read && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                markAsRead(item.id);
              }}
            >
              <Check size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              deleteNotification(item.id);
            }}
          >
            <Trash2 size={16} color="#666" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    ),
    [markAsRead, deleteNotification],
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Bell size={40} color="#666" />
      </View>
      <Text style={styles.emptyTitle} numberOfLines={1} ellipsizeMode="tail">
        No notifications yet
      </Text>
      <Text style={styles.emptyMessage} numberOfLines={3} ellipsizeMode="tail">
        You'll see notifications here when people interact with your content
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
        Notifications
      </Text>
      {notifications.some((n) => !n.read) && (
        <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
          <Text style={styles.markAllButtonText}>Mark all read</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading && notifications.length === 0) {
    return (
      <BackgroundGradient>
        <SafeAreaView style={styles.container}>
          {renderHeader()}
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        </SafeAreaView>
      </BackgroundGradient>
    );
  }

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.container}>
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={[
            styles.listContent,
            notifications.length === 0 && styles.emptyListContent,
          ]}
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
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '900',
    color: theme.colors.text,
    letterSpacing: 2,
    textTransform: 'uppercase',
    flex: 1,
  },
  markAllButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#30D158',
    backgroundColor: 'transparent',
    borderRadius: 8,
  },
  markAllButtonText: {
    fontSize: theme.fontSize.sm,
    color: '#30D158',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: '#888',
  },
  listContent: {
    paddingBottom: theme.spacing.md,
    paddingTop: 4,
  },
  emptyListContent: {
    flex: 1,
  },
  notificationItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  unreadNotification: {
    borderColor: 'rgba(48,209,88,0.3)',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#f0f0f0',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 12,
    color: '#888',
    lineHeight: 18,
    marginBottom: theme.spacing.xs,
  },
  notificationTime: {
    fontSize: 10,
    color: '#666',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  notificationActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexShrink: 0,
  },
  actionButton: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '900',
    color: theme.colors.text,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.sm,
  },
  emptyMessage: {
    fontSize: theme.fontSize.md,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});
