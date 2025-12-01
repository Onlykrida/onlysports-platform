import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Eye } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';

interface ProfileViewer {
  viewer_id: string;
  viewer_name: string;
  viewer_avatar?: string;
  viewer_role: string;
  last_viewed: string;
  view_count: number;
}

interface ProfileViewersCardProps {
  userId: string;
  isOwnProfile?: boolean;
}

export function ProfileViewersCard({ userId, isOwnProfile = false }: ProfileViewersCardProps) {
  const [viewers, setViewers] = useState<ProfileViewer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalViews, setTotalViews] = useState(0);

  useEffect(() => {
    loadProfileViewers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadProfileViewers = async () => {
    if (!isSupabaseConfigured || !userId) return;

    try {
      setIsLoading(true);
      
      const [viewersResult, countResult] = await Promise.all([
        supabase.rpc('get_profile_viewers', {
          p_profile_id: userId,
          p_limit: 20
        }),
        supabase.rpc('get_profile_views_count', {
          p_profile_id: userId
        })
      ]);

      if (viewersResult.error) {
        console.error('ProfileViewersCard: load viewers error', viewersResult.error);
      } else {
        setViewers((viewersResult.data || []) as ProfileViewer[]);
      }

      if (countResult.error) {
        console.error('ProfileViewersCard: load count error', countResult.error);
      } else {
        setTotalViews(countResult.data || 0);
      }
    } catch (e) {
      console.error('ProfileViewersCard: load exception', e);
    } finally {
      setIsLoading(false);
    }
  };

  const formatRole = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  };

  if (!isOwnProfile) {
    return null;
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Eye size={20} color={theme.colors.primary} />
          <Text style={styles.headerTitle}>Profile Views</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  if (viewers.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Eye size={20} color={theme.colors.primary} />
          <Text style={styles.headerTitle}>Profile Views</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>0</Text>
          </View>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No one has viewed your profile yet
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Eye size={20} color={theme.colors.primary} />
        <Text style={styles.headerTitle}>Profile Views</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{totalViews}</Text>
        </View>
      </View>

      <View style={styles.list}>
        {viewers.slice(0, 20).map((viewer, index) => (
          <TouchableOpacity
            key={`${viewer.viewer_id}-${index}`}
            style={styles.viewerItem}
            onPress={() => router.push(`/user/${viewer.viewer_id}`)}
            testID={`profile-viewer-${index}`}
          >
            <Image
              source={{
                uri: viewer.viewer_avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
              }}
              style={styles.avatar}
            />
            <View style={styles.viewerInfo}>
              <Text style={styles.viewerName}>{viewer.viewer_name}</Text>
              <Text style={styles.viewerRole}>{formatRole(viewer.viewer_role)}</Text>
              <Text style={styles.viewedTime}>
                {getTimeAgo(viewer.last_viewed)}
                {viewer.view_count > 1 && ` • ${viewer.view_count} views`}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    flex: 1,
  },
  badge: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  list: {
    gap: theme.spacing.sm,
  },
  viewerItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  viewerInfo: {
    flex: 1,
    gap: 2,
  },
  viewerName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  viewerRole: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  viewedTime: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
});
