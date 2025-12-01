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
import { Heart } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';

interface ScoutInterest {
  scout_id: string;
  scout_name: string;
  scout_avatar?: string;
  scout_organization?: string;
  last_interaction: string;
  actions: string[];
}

interface ScoutInterestsCardProps {
  userId: string;
  isOwnProfile?: boolean;
}

export function ScoutInterestsCard({ userId, isOwnProfile = false }: ScoutInterestsCardProps) {
  const [scouts, setScouts] = useState<ScoutInterest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadScoutInterests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadScoutInterests = async () => {
    if (!isSupabaseConfigured || !userId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase.rpc('get_interested_scouts_for_athlete', {
        p_athlete_id: userId,
        p_limit: 20
      });

      if (error) {
        console.error('ScoutInterestsCard: load error', error);
        return;
      }

      setScouts((data || []) as ScoutInterest[]);
    } catch (e) {
      console.error('ScoutInterestsCard: load exception', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Heart size={20} color={theme.colors.danger} />
          <Text style={styles.headerTitle}>Scouts & Coaches Interested</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  if (scouts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Heart size={20} color={theme.colors.danger} />
          <Text style={styles.headerTitle}>Scouts & Coaches Interested</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {isOwnProfile 
              ? 'No scouts have shown interest yet' 
              : 'No scouts have shown interest in this athlete'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Heart size={20} color={theme.colors.danger} />
        <Text style={styles.headerTitle}>Scouts & Coaches Interested</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{scouts.length}</Text>
        </View>
      </View>

      <View style={styles.list}>
        {scouts.slice(0, 10).map((scout, index) => (
          <TouchableOpacity
            key={`${scout.scout_id}-${index}`}
            style={styles.scoutItem}
            onPress={() => router.push(`/user/${scout.scout_id}`)}
            testID={`scout-interest-${index}`}
          >
            <Image
              source={{
                uri: scout.scout_avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
              }}
              style={styles.avatar}
            />
            <View style={styles.scoutInfo}>
              <Text style={styles.scoutName}>{scout.scout_name}</Text>
              {scout.scout_organization && (
                <Text style={styles.scoutOrganization}>{scout.scout_organization}</Text>
              )}
              <View style={styles.actionsContainer}>
                {scout.actions.map((action, idx) => (
                  <View key={idx} style={styles.actionBadge}>
                    <Text style={styles.actionText}>
                      {action === 'view' && '👁️ Viewed'}
                      {action === 'bookmark' && '⭐ Bookmarked'}
                      {action === 'request' && '📩 Requested'}
                      {action === 'interested' && '❤️ Interested'}
                    </Text>
                  </View>
                ))}
              </View>
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
    backgroundColor: theme.colors.danger,
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
  scoutItem: {
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
    borderColor: theme.colors.danger,
  },
  scoutInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  scoutName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  scoutOrganization: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  actionBadge: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  actionText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
});
