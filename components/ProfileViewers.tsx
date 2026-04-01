import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Eye, ChevronRight, TrendingUp } from 'lucide-react-native';
import { router } from 'expo-router';
import { theme } from '@/constants/theme';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';
import CachedImage from '@/components/CachedImage';

interface ProfileViewer {
  viewer_id: string;
  viewer_name: string;
  viewer_avatar: string | null;
  viewer_role: string;
  viewed_at: string;
}

interface ProfileViewersProps {
  userId: string;
}

export default function ProfileViewers({ userId }: ProfileViewersProps) {
  const [viewers, setViewers] = useState<ProfileViewer[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [weeklyViews, setWeeklyViews] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadViewers = useCallback(async () => {
    if (!isSupabaseConfigured || !userId) {
      setIsLoading(false);
      return;
    }

    try {
      // Get total view count
      const { count: total } = await supabase
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', userId);

      // Get weekly view count
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { count: weekly } = await supabase
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', userId)
        .gte('created_at', weekAgo);

      setTotalViews(total || 0);
      setWeeklyViews(weekly || 0);

      // Get recent viewers with profile info
      const { data } = await supabase
        .from('profile_views')
        .select(
          `
          viewer_id,
          created_at,
          viewer:profiles!profile_views_viewer_id_fkey(name, avatar, role)
        `,
        )
        .eq('profile_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) {
        const mapped = data.map((v: any) => ({
          viewer_id: v.viewer_id,
          viewer_name: v.viewer?.name || 'Someone',
          viewer_avatar: v.viewer?.avatar || null,
          viewer_role: v.viewer?.role || 'user',
          viewed_at: v.created_at,
        }));
        setViewers(mapped);
      }
    } catch (error) {
      console.error('Failed to load profile viewers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadViewers();
  }, [loadViewers]);

  if (isLoading) return null;
  if (totalViews === 0 && viewers.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Eye size={18} color={theme.colors.primary} />
        <Text style={styles.title}>Who Viewed Your Profile</Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalViews}</Text>
          <Text style={styles.statLabel}>Total Views</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={styles.weeklyRow}>
            <Text style={styles.statNumber}>{weeklyViews}</Text>
            {weeklyViews > 0 && <TrendingUp size={14} color={theme.colors.primary} />}
          </View>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
      </View>

      {/* Recent viewers */}
      {viewers.length > 0 && (
        <View style={styles.viewersList}>
          {viewers.slice(0, 3).map((viewer) => (
            <TouchableOpacity
              key={viewer.viewer_id + viewer.viewed_at}
              style={styles.viewerRow}
              onPress={() => router.push(`/user/${viewer.viewer_id}` as any)}
            >
              <CachedImage source={viewer.viewer_avatar} size={36} placeholder="avatar" />
              <View style={styles.viewerInfo}>
                <Text style={styles.viewerName} numberOfLines={1}>
                  {viewer.viewer_name}
                </Text>
                <Text style={styles.viewerRole}>{viewer.viewer_role}</Text>
              </View>
              <Text style={styles.viewerTime}>{getRelativeTime(viewer.viewed_at)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {weeklyViews > 0 && (
        <Text style={styles.encouragement}>
          Scouts are noticing you! Keep your profile updated.
        </Text>
      )}
    </View>
  );
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.12)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.border,
  },
  weeklyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.extrabold,
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  viewersList: {
    gap: theme.spacing.sm,
  },
  viewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  viewerInfo: {
    flex: 1,
  },
  viewerName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  viewerRole: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textTransform: 'capitalize',
  },
  viewerTime: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  encouragement: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    fontStyle: 'italic',
  },
});
