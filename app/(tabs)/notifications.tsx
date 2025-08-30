import React from 'react';
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
  UserCheck
} from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { Notification } from '@/types';
import { useNotifications } from '@/hooks/notifications-context';
import { router } from 'expo-router';

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
  
  return date.toLocaleDateString();
};

const handleNotificationPress = (notification: Notification) => {
  // Handle navigation based on notification type
  switch (notification.type) {
    case 'like':
    case 'comment':
    case 'post':
      if (notification.data?.postId) {
        router.push(`/post/${notification.data.postId}`);
      }
      break;
    case 'follow':
    case 'connection_request':
    case 'connection_accepted':
    case 'profile_view':
      if (notification.data?.followerId || notification.data?.userId) {
        router.push(`/user/${notification.data.followerId || notification.data.userId}`);
      }
      break;
    case 'message':
      if (notification.data?.senderId) {
        router.push(`/chat/${notification.data.senderId}`);
      }
      break;
    case 'opportunity':
      router.push('/opportunities');
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

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadNotification]}
      onPress={() => {
        if (!item.read) {
          markAsRead(item.id);
        }
        handleNotificationPress(item);
      }}
    >
      <View style={styles.notificationIcon}>
        {getNotificationIcon(item.type)}
      </View>
      
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>
          {formatTimeAgo(item.createdAt)}
        </Text>
      </View>

      <View style={styles.notificationActions}>
        {!item.read && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              markAsRead(item.id);
            }}
          >
            <Check size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            deleteNotification(item.id);
          }}
        >
          <Trash2 size={16} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Bell size={48} color={theme.colors.textSecondary} />
      <Text style={styles.emptyTitle}>No notifications yet</Text>
      <Text style={styles.emptyMessage}>
        You'll see notifications here when people interact with your content
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Notifications</Text>
      {notifications.some(n => !n.read) && (
        <TouchableOpacity
          onPress={markAllAsRead}
          style={styles.markAllButton}
        >
          <Text style={styles.markAllButtonText}>Mark all read</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading && notifications.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.emptyListContent
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
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  markAllButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  markAllButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
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
  listContent: {
    paddingBottom: theme.spacing.md,
  },
  emptyListContent: {
    flex: 1,
  },
  notificationItem: {
    backgroundColor: theme.colors.white,
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