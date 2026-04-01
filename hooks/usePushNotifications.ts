import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';
import { useAuth } from './auth-context';

const isWeb = Platform.OS === 'web';

// Dynamically import expo-notifications to handle SDK version mismatches
// (e.g., SDK 54 app running in SDK 53 Expo Go)
let Notifications: typeof import('expo-notifications') | null = null;
let Device: typeof import('expo-device') | null = null;

try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
} catch (e) {
  console.warn('expo-notifications not available:', e);
}

// Configure how notifications appear when the app is in the foreground
if (!isWeb && Notifications) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    console.warn('Failed to set notification handler:', e);
  }
}

// Notification category identifiers
const NOTIFICATION_CATEGORIES = {
  MESSAGE: 'message',
  LIKE: 'like',
  FOLLOW: 'follow',
  COMMENT: 'comment',
  OPPORTUNITY: 'opportunity',
} as const;

async function registerNotificationCategories() {
  if (!Notifications) return;
  await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.MESSAGE, [
    { identifier: 'reply', buttonTitle: 'Reply', options: { opensAppToForeground: true } },
    {
      identifier: 'mark_read',
      buttonTitle: 'Mark as Read',
      options: { opensAppToForeground: false },
    },
  ]);

  await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.LIKE, [
    { identifier: 'view', buttonTitle: 'View Post', options: { opensAppToForeground: true } },
  ]);

  await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.FOLLOW, [
    {
      identifier: 'view_profile',
      buttonTitle: 'View Profile',
      options: { opensAppToForeground: true },
    },
  ]);

  await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.COMMENT, [
    { identifier: 'reply', buttonTitle: 'Reply', options: { opensAppToForeground: true } },
    { identifier: 'view', buttonTitle: 'View Post', options: { opensAppToForeground: true } },
  ]);

  await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.OPPORTUNITY, [
    { identifier: 'view', buttonTitle: 'View', options: { opensAppToForeground: true } },
  ]);
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Notifications || !Device) return null;

  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  // Android requires a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1a8cff',
    });
  }

  try {
    // In Expo Go dev, projectId may not be available — catch and skip silently
    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch (error) {
    if (__DEV__) console.log('Push token not available in dev (expected in Expo Go)');
    return null;
  }
}

async function savePushTokenToSupabase(userId: string, token: string) {
  if (!isSupabaseConfigured) return;

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', userId);

    if (error) {
      // The push_token column may not exist yet — handle gracefully
      if (error.code === '42703' || error.message?.includes('push_token')) {
        console.warn(
          'push_token column does not exist on profiles table. ' +
            'Run: ALTER TABLE profiles ADD COLUMN push_token TEXT;',
        );
      } else {
        console.error('Error saving push token:', error);
      }
    }
  } catch (error) {
    console.error('Failed to save push token to Supabase:', error);
  }
}

function getDeepLinkFromNotification(notification: any): string | null {
  const data = notification.request.content.data;
  if (!data) return null;

  const type = data.type as string | undefined;
  const id = data.id as string | undefined;

  switch (type) {
    case 'message':
      // Navigate to the chat screen; if a conversationId is provided, go there
      return data.conversationId ? `/chat/${data.conversationId}` : '/chat';
    case 'like':
    case 'comment':
      // Navigate to the relevant post (notifications screen as fallback)
      return data.postId ? `/post/${data.postId}` : '/notifications';
    case 'follow':
    case 'connection_request':
    case 'connection_accepted':
    case 'profile_view':
      return data.userId ? `/user/${data.userId}` : '/notifications';
    case 'opportunity':
    case 'application':
      return data.opportunityId ? `/opportunity/${data.opportunityId}` : '/notifications';
    default:
      // Generic fallback: go to notifications screen
      return '/notifications';
  }
}

export function usePushNotifications() {
  const { user } = useAuth();
  const router = useRouter();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  // Skip all push notification logic on web or if notifications unavailable
  useEffect(() => {
    if (isWeb || !user?.id || !Notifications) return;

    let isMounted = true;

    (async () => {
      await registerNotificationCategories();

      const token = await registerForPushNotificationsAsync();
      if (token && isMounted) {
        setExpoPushToken(token);
        await savePushTokenToSupabase(user.id, token);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Handle incoming notifications (foreground)
  useEffect(() => {
    if (isWeb || !Notifications) return;

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      if (__DEV__) {
        console.log('Push notification received:', notification.request.content.title);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
    };
  }, []);

  // Handle notification tap (background / killed → opened)
  useEffect(() => {
    if (isWeb || !Notifications) return;

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const route = getDeepLinkFromNotification(response.notification);
      if (route) {
        setTimeout(() => {
          router.push(route as any);
        }, 500);
      }
    });

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [router]);

  // Handle the notification that originally launched the app (cold start)
  useEffect(() => {
    if (isWeb || !Notifications) return;

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const route = getDeepLinkFromNotification(response.notification);
        if (route) {
          setTimeout(() => {
            router.push(route as any);
          }, 1000);
        }
      }
    });
  }, [router]);

  return { expoPushToken };
}
