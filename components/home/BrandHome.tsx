import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { FLATLIST_PERF_PROPS } from '@/constants/performance';
import BgGradient from '@/components/BackgroundGradient';
import CachedImage from '@/components/CachedImage';
import { TrendingUp, Heart, Users, ChevronDown, ChevronUp } from 'lucide-react-native';
import { router } from 'expo-router';
import { theme } from '@/constants/theme';
import { User } from '@/types';
import { useScouting } from '@/hooks/scouting-context';
import { useAuth } from '@/hooks/auth-context';
import { useUsers } from '@/hooks/users-context';
import { usePosts } from '@/hooks/posts-context';
import { useAnalytics, EVENTS } from '@/hooks/useAnalytics';

const ItemSeparator = () => <View style={{ height: theme.spacing.sm }} />;

export default function BrandHome() {
  const { user } = useAuth();
  const { expressInterest, hasExpressedInterest, getInterestedAthletesForOrg } = useScouting();
  const { users } = useUsers();
  const { posts } = usePosts();
  const { track } = useAnalytics();

  const [interestedAthletes, setInterestedAthletes] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [interestsExpanded, setInterestsExpanded] = useState(false);

  useEffect(() => {
    track(EVENTS.SCREEN_VIEW, { screen: 'home_brand' });
  }, []);

  useEffect(() => {
    if (user?.id) loadData();
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const athletes = await getInterestedAthletesForOrg(user.id);
      setInterestedAthletes(athletes);
    } catch (e) {
      console.error('BrandHome: failed to load data', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleUserPress = useCallback((userId: string) => {
    router.push({ pathname: '/user/[id]' as any, params: { id: userId } });
  }, []);

  const handleExpressInterest = useCallback(
    async (athleteId: string) => {
      const { error } = await expressInterest(athleteId);
      if (error) console.error('Express interest failed:', error);
      else await loadData();
    },
    [expressInterest],
  );

  // Build trending athletes: all athletes sorted by follower count — memoized to avoid re-sorting on every render
  const trendingAthletes = useMemo(
    () =>
      users
        .filter((u) => u.role === 'athlete')
        .sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0))
        .slice(0, 20),
    [users],
  );

  // Count posts per user for engagement metric — memoized to avoid recreating on every render
  const postCountMap = useMemo(
    () =>
      posts.reduce<Record<string, number>>((acc, p) => {
        acc[p.userId] = (acc[p.userId] || 0) + 1;
        return acc;
      }, {}),
    [posts],
  );

  const renderTrendingAthlete = useCallback(
    ({ item }: { item: User }) => {
      const interested = hasExpressedInterest(item.id);
      const engagement = postCountMap[item.id] || 0;

      return (
        <View style={styles.athleteCard}>
          <TouchableOpacity style={styles.athleteInfo} onPress={() => handleUserPress(item.id)}>
            <CachedImage source={item.avatar} size={40} placeholder="avatar" />
            <View style={styles.athleteDetails}>
              <Text style={styles.athleteName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.athleteMeta} numberOfLines={1} ellipsizeMode="tail">
                {item.sport?.toUpperCase() || 'ATHLETE'}
              </Text>
              <View style={styles.engagementRow}>
                <Users size={10} color={theme.colors.textMuted} />
                <Text style={styles.engagementText} numberOfLines={1}>
                  {item.followersCount || 0} followers
                </Text>
                {engagement > 0 && (
                  <>
                    <View style={styles.dot} />
                    <Text style={styles.engagementText}>{engagement} posts</Text>
                  </>
                )}
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.interestBtn, interested && styles.interestBtnActive]}
            onPress={() => !interested && handleExpressInterest(item.id)}
            disabled={interested}
          >
            <Text style={[styles.interestBtnText, interested && styles.interestBtnTextActive]}>
              {interested ? 'INTERESTED' : 'EXPRESS INTEREST'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    },
    [hasExpressedInterest, postCountMap, handleUserPress, handleExpressInterest],
  );

  const renderInterestedAthlete = useCallback(
    ({ item }: { item: User }) => (
      <TouchableOpacity style={styles.interestedCard} onPress={() => handleUserPress(item.id)}>
        <CachedImage source={item.avatar} size={36} placeholder="avatar" />
        <View style={{ flex: 1 }}>
          <Text style={styles.interestedName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.interestedMeta} numberOfLines={1} ellipsizeMode="tail">
            {item.sport || 'Athlete'} {item.position ? `/ ${item.position}` : ''}
          </Text>
        </View>
        <View style={styles.interestedBadge}>
          <Heart size={12} color="#FF9F0A" fill="#FF9F0A" />
        </View>
      </TouchableOpacity>
    ),
    [handleUserPress],
  );

  const ListHeader = () => (
    <View>
      {/* Trending Athletes Section */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TRENDING ATHLETES</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{trendingAthletes.length}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const ListFooter = () => (
    <View>
      {/* My Interests Collapsible */}
      <View style={styles.sectionContainer}>
        <TouchableOpacity
          style={styles.sectionHeaderTouchable}
          onPress={() => setInterestsExpanded(!interestsExpanded)}
          activeOpacity={0.7}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>MY INTERESTS</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{interestedAthletes.length}</Text>
            </View>
          </View>
          {interestsExpanded ? (
            <ChevronUp size={18} color={theme.colors.textMuted} />
          ) : (
            <ChevronDown size={18} color={theme.colors.textMuted} />
          )}
        </TouchableOpacity>

        {interestsExpanded &&
          (interestedAthletes.length === 0 ? (
            <View style={styles.emptyCard}>
              <Heart size={24} color={theme.colors.textMuted} />
              <Text style={styles.emptyText}>No interests expressed yet</Text>
              <Text style={styles.emptySubtext}>
                Express interest in trending athletes above to start connecting
              </Text>
            </View>
          ) : (
            <FlatList
              data={interestedAthletes}
              renderItem={renderInterestedAthlete}
              keyExtractor={(item, index) => item.id ?? `interested-${index}`}
              scrollEnabled={false}
              ItemSeparatorComponent={ItemSeparator}
              {...FLATLIST_PERF_PROPS}
            />
          ))}
      </View>
    </View>
  );

  if (loading && trendingAthletes.length === 0) {
    return (
      <BgGradient style={styles.container}>
        <View style={styles.headerBar}>
          <View style={styles.headerAccent} />
          <Text style={styles.headerTitle}>DISCOVER TALENT</Text>
        </View>
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      </BgGradient>
    );
  }

  return (
    <BgGradient style={styles.container}>
      <View style={styles.headerBar}>
        <View style={styles.headerAccent} />
        <Text style={styles.headerTitle}>DISCOVER TALENT</Text>
      </View>
      <FlatList
        data={trendingAthletes}
        renderItem={renderTrendingAthlete}
        keyExtractor={(item, index) => item.id ?? `trending-${index}`}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <TrendingUp size={40} color={theme.colors.textMuted} />
            <Text style={styles.emptyText}>No athletes found</Text>
            <Text style={styles.emptySubtext}>
              Athletes will appear here as they join the platform
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={ItemSeparator}
        {...FLATLIST_PERF_PROPS}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </BgGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingBottom: theme.spacing.xxl },

  // Header
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: 60,
    paddingBottom: theme.spacing.md,
  },
  headerAccent: {
    width: 4,
    height: 24,
    backgroundColor: '#FF9F0A',
    borderRadius: 2,
    marginRight: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },

  // Section
  sectionContainer: { marginHorizontal: theme.spacing.sm, marginBottom: theme.spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: '#30D158',
    paddingLeft: 12,
    flex: 1,
  },
  sectionHeaderTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    letterSpacing: 2,
    textTransform: 'uppercase',
    flex: 1,
  },
  countBadge: {
    backgroundColor: theme.colors.orange,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: { color: '#0a0a0a', fontSize: 10, fontWeight: theme.fontWeight.black },

  // Athlete Card
  athleteCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.sm,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  athleteInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm },
  athleteAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FF9F0A',
    marginRight: theme.spacing.sm,
    flexShrink: 0,
  },
  athleteDetails: { flex: 1 },
  athleteName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    letterSpacing: 0.5,
  },
  athleteMeta: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    letterSpacing: 1,
    marginTop: 2,
  },
  engagementRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  engagementText: { fontSize: 10, color: theme.colors.textMuted },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: theme.colors.textMuted },

  interestBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: '#FF9F0A',
  },
  interestBtnActive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#FF9F0A',
  },
  interestBtnText: {
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    color: '#0a0a0a',
    letterSpacing: 1,
  },
  interestBtnTextActive: { color: '#FF9F0A' },

  // Interested Card
  interestedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.08)',
    gap: theme.spacing.sm,
  },
  interestedAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FF9F0A',
    flexShrink: 0,
  },
  interestedName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  interestedMeta: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 },
  interestedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,159,10,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // Empty
  emptyCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginHorizontal: theme.spacing.sm,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
});
