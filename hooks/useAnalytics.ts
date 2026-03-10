import { useCallback, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { supabase } from '@/constants/supabase';
import { useAuth } from '@/hooks/auth-context';

// Predefined event names
export const EVENTS = {
  SCREEN_VIEW: 'screen_view',
  POST_CREATED: 'post_created',
  POST_LIKED: 'post_liked',
  POST_COMMENTED: 'post_commented',
  OPPORTUNITY_VIEWED: 'opportunity_viewed',
  OPPORTUNITY_APPLIED: 'opportunity_applied',
  MESSAGE_SENT: 'message_sent',
  FOLLOW: 'follow',
  UNFOLLOW: 'unfollow',
  SEARCH: 'search',
  INTEREST_EXPRESSED: 'interest_expressed',
  PROFILE_VIEWED: 'profile_viewed',
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS] | string;

interface AnalyticsEvent {
  user_id: string;
  event_name: string;
  properties: Record<string, any>;
  device_info: Record<string, any>;
  created_at: string;
}

const APP_VERSION = '1.0.0';
const BATCH_SIZE = 10;
const TABLE_NAME = 'analytics_events';

// Module-level buffer shared across hook instances so events aren't lost on re-renders
let eventBuffer: AnalyticsEvent[] = [];
let flushInProgress = false;

async function flushEvents(): Promise<void> {
  if (flushInProgress || eventBuffer.length === 0) return;

  flushInProgress = true;
  const batch = eventBuffer.splice(0, eventBuffer.length);

  try {
    const { error } = await supabase.from(TABLE_NAME).insert(batch);
    if (error) {
      // Table might not exist yet or other DB error -- fail silently
      if (__DEV__) {
        console.debug('[Analytics] flush failed (silent):', error.message);
      }
    }
  } catch {
    // Network or other unexpected error -- fail silently
    if (__DEV__) {
      console.debug('[Analytics] flush exception (silent)');
    }
  } finally {
    flushInProgress = false;
  }
}

export function useAnalytics() {
  const { user } = useAuth();
  const userIdRef = useRef<string | null>(null);

  // Keep user id in a ref so the track callback never goes stale
  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user?.id]);

  // Flush remaining events when app goes to background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        flushEvents();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const track = useCallback(
    (eventName: EventName, properties?: Record<string, any>) => {
      const userId = userIdRef.current;
      if (!userId) return; // Not logged in -- skip

      const event: AnalyticsEvent = {
        user_id: userId,
        event_name: eventName,
        properties: properties ?? {},
        device_info: {
          platform: Platform.OS,
          os_version: Platform.Version,
          app_version: APP_VERSION,
        },
        created_at: new Date().toISOString(),
      };

      eventBuffer.push(event);

      // Flush when the buffer reaches the batch size (non-blocking)
      if (eventBuffer.length >= BATCH_SIZE) {
        flushEvents();
      }
    },
    [],
  );

  return { track, EVENTS };
}
