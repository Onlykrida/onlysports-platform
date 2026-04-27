import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Trophy } from 'lucide-react-native';
import BgGradient from '@/components/BackgroundGradient';
import DashboardHeader from '@/components/home/scout/DashboardHeader';
import CoachQuickActions from '@/components/home/coach/CoachQuickActions';
import CoachAthletesSection from '@/components/home/coach/CoachAthletesSection';
import MiniPostCard from '@/components/home/coach/MiniPostCard';
import SectionHeader from '@/components/home/shared/SectionHeader';
import { theme } from '@/constants/theme';
import { FLATLIST_PERF_PROPS } from '@/constants/performance';
import type { Post, User } from '@/types';
import { useScouting } from '@/hooks/scouting-context';
import { usePosts } from '@/hooks/posts-context';
import { useAuth } from '@/hooks/auth-context';
import { useAnalytics, EVENTS } from '@/hooks/useAnalytics';

const ItemSeparator = () => <View style={{ height: theme.spacing.sm }} />;

export default function CoachHome() {
  const { user } = useAuth();
  const { getInterestedAthletesForOrg } = useScouting();
  const { posts, isLoading, refreshPosts, likePost, loadMore, isLoadingMore } = usePosts();
  const { track } = useAnalytics();

  const [myAthletes, setMyAthletes] = useState<User[]>([]);
  const [loadingAthletes, setLoadingAthletes] = useState(true);

  useEffect(() => {
    track(EVENTS.SCREEN_VIEW, { screen: 'home_coach' });
  }, []);

  useEffect(() => {
    if (user?.id) loadAthletes();
  }, [user?.id]);

  const loadAthletes = async () => {
    if (!user?.id) return;
    setLoadingAthletes(true);
    try {
      const athletes = await getInterestedAthletesForOrg(user.id);
      setMyAthletes(athletes);
    } catch (e) {
      if (__DEV__) console.error('CoachHome: failed to load athletes', e);
    } finally {
      setLoadingAthletes(false);
    }
  };

  const onRefresh = async () => {
    await Promise.all([refreshPosts(), loadAthletes()]);
  };

  const handleUserPress = useCallback(
    (userId: string) => {
      if (userId === user?.id) {
        router.push('/(tabs)/profile' as any);
      } else {
        router.push({ pathname: '/user/[id]' as any, params: { id: userId } });
      }
    },
    [user?.id],
  );

  const renderMiniPost = useCallback(
    ({ item }: { item: Post }) => (
      <MiniPostCard
        post={item}
        onUserPress={handleUserPress}
        onLike={(id) => {
          track(EVENTS.POST_LIKED, { postId: id });
          likePost(id);
        }}
      />
    ),
    [handleUserPress, likePost, track],
  );

  const ListHeader = () => (
    <View>
      <CoachQuickActions
        onPostTrial={() => router.push('/opportunities/create' as any)}
        onFindAthletes={() => router.push('/(tabs)/discover' as any)}
        onMessages={() => router.push('/(tabs)/messages' as any)}
      />
      <CoachAthletesSection
        athletes={myAthletes}
        isLoading={loadingAthletes}
        onUserPress={handleUserPress}
      />
      <View style={styles.sectionContainer}>
        <SectionHeader title="RECENT FEED" />
      </View>
    </View>
  );

  if (isLoading && posts.length === 0) {
    return (
      <BgGradient style={styles.container}>
        <DashboardHeader title="COACH HQ" />
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      </BgGradient>
    );
  }

  return (
    <BgGradient style={styles.container}>
      <DashboardHeader title="COACH HQ" />
      <FlatList
        data={posts.slice(0, 15)}
        renderItem={renderMiniPost}
        keyExtractor={(item, index) => item.id ?? `post-${index}`}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Trophy size={40} color={theme.colors.textMuted} />
          </View>
        }
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={ItemSeparator}
        {...FLATLIST_PERF_PROPS}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        onEndReached={() => loadMore()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : null
        }
      />
    </BgGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingBottom: theme.spacing.xxl },
  sectionContainer: {
    marginHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  footerLoader: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginHorizontal: theme.spacing.sm,
    ...theme.dashBorder,
  },
});
