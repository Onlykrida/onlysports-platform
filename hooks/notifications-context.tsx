import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Notification } from '@/types';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';
import { useAuth } from './auth-context';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  createNotification: (
    userId: string,
    type: Notification['type'],
    title: string,
    message: string,
    data?: any,
  ) => Promise<void>;
}

const NOTIFICATION_DEFAULTS: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteNotification: async () => {},
  refreshNotifications: async () => {},
  createNotification: async () => {},
};

const [NotificationProvider, _useNotifications] = createContextHook<NotificationState>(() => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user } = useAuth();

  const loadNotifications = useCallback(async () => {
    if (!user || !isSupabaseConfigured) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }

      const notificationsList: Notification[] = (data || []).map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        type: item.type,
        title: item.title,
        message: item.message,
        data: item.data,
        read: item.read,
        createdAt: new Date(item.created_at),
      }));

      setNotifications(notificationsList);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Real-time subscription for notifications
  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;

    const channel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload: any) => {
          const n = payload.new as {
            id: string;
            user_id: string;
            type: string;
            title: string;
            message: string;
            data?: any;
            read: boolean;
            created_at: string;
          };
          if (n.user_id !== user.id) return;
          const notif: Notification = {
            id: n.id,
            userId: n.user_id,
            type: n.type as Notification['type'],
            title: n.title,
            message: n.message,
            data: n.data,
            read: n.read,
            createdAt: new Date(n.created_at),
          };
          setNotifications((prev) => [notif, ...prev]);
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!isSupabaseConfigured) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId ? { ...notification, read: true } : notification,
        ),
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user || !isSupabaseConfigured) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return;
      }

      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [user]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!isSupabaseConfigured) return;

    try {
      const { error } = await supabase.from('notifications').delete().eq('id', notificationId);

      if (error) {
        console.error('Error deleting notification:', error);
        return;
      }

      setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, []);

  const createNotification = useCallback(
    async (
      userId: string,
      type: Notification['type'],
      title: string,
      message: string,
      data?: any,
    ) => {
      if (!isSupabaseConfigured) return;

      try {
        const { error } = await supabase.from('notifications').insert({
          user_id: userId,
          type,
          title,
          message,
          data,
          read: false,
        });

        if (error) {
          console.error('Error creating notification:', error);
        }
      } catch (error) {
        console.error('Failed to create notification:', error);
      }
    },
    [],
  );

  const refreshNotifications = useCallback(async () => {
    await loadNotifications();
  }, [loadNotifications]);

  const unreadCount = useMemo(() => {
    return notifications.filter((notification) => !notification.read).length;
  }, [notifications]);

  return useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      refreshNotifications,
      createNotification,
    }),
    [
      notifications,
      unreadCount,
      isLoading,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      refreshNotifications,
      createNotification,
    ],
  );
});

export { NotificationProvider };
export const useNotifications = () => _useNotifications() ?? NOTIFICATION_DEFAULTS;
