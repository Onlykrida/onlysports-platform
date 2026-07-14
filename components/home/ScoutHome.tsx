import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import BgGradient from '@/components/BackgroundGradient';
import EmptyState from '@/components/EmptyState';
import { Award } from 'lucide-react-native';
import { router } from 'expo-router';
import { theme } from '@/constants/theme';
import { FLATLIST_PERF_PROPS } from '@/constants/performance';
import { User } from '@/types';
import { useScouting, AIRecommendationRow } from '@/hooks/scouting-context';
import { useAuth } from '@/hooks/auth-context';
import { useUsers } from '@/hooks/users-context';
import { useAnalytics, EVENTS } from '@/hooks/useAnalytics';
import { useFitnessTest } from '@/hooks/fitness-test-context';

import DashboardHeader from './scout/DashboardHeader';
import ScoutStatsBar from './scout/ScoutStatsBar';
import ScoutPrimaryActions from './scout/ScoutPrimaryActions';
import AthleteMatchCard from './scout/AthleteMatchCard';
import ShortlistSection from './scout/ShortlistSection';
import SectionHeader from './shared/SectionHeader';

const ItemSeparator = () => <View style={{ height: theme.spacing.sm }} />;

export default function ScoutHome() {
  const { user } = useAuth();
  const {
    topRecommendations,
    getTopForScout,
    computeForScout,
    shortlist,
    shortlistAthlete,
    removeFromShortlist,
    isShortlisted,
    getScoutDashboard,
    dashboardData,
    isDashboardLoading,
  } = useScouting();
  const { users } = useUsers();
  const { track } = useAnalytics();

  const { fetchLatestBatch } = useFitnessTest();
  const [recommendations, setRecommendations] = useState<AIRecommendationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shortlistExpanded, setShortlistExpanded] = useState(false);
  const [athleteFitnessZones, setAthleteFitnessZones] = useState<Record<string, string>>({});

  useEffect(() => {
    track(EVENTS.SCREEN_VIEW, { screen: 'home_scout' });
  }, []);

  useEffect(() => {
    const athleteIds = recommendations.map((r) => r.player_id).filter(Boolean) as string[];
    if (athleteIds.length === 0) return;
    fetchLatestBatch(athleteIds, 'yoyo')
      .then((batchMap) => {
        const zones: Record<string, string> = {};
        batchMap.forEach((result, id) => {
          if (result?.zone) zones[id] = result.zone;
        });
        setAthleteFitnessZones(zones);
      })
      .catch(() => {});
  }, [recommendations]);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [recs] = await Promise.all([getTopForScout(user.id, 20), getScoutDashboard()]);
      if (recs.length > 0) {
        setRecommendations(recs);
      } else {
        // No saved recommendations — compute fresh ones from player stats
        if (__DEV__) console.log('ScoutHome: No recommendations found, computing fresh');
        const { recommendations: freshRecs } = await computeForScout(user.id);
        setRecommendations(freshRecs);
        // Re-fetch dashboard after computing
        await getScoutDashboard();
      }
    } catch (e) {
      if (__DEV__) console.error('ScoutHome: failed to load data', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    if (!user?.id) return;
    setRefreshing(true);
    try {
      // On refresh, always recompute from latest player stats
      const { recommendations: freshRecs } = await computeForScout(user.id);
      setRecommendations(freshRecs);
      await getScoutDashboard();
    } catch (e) {
      if (__DEV__) console.error('ScoutHome: refresh failed', e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleUserPress = useCallback((userId: string) => {
    router.push({ pathname: '/user/[id]' as any, params: { id: userId } });
  }, []);

  const handleShortlist = useCallback(
    async (athleteId: string) => {
      if (isShortlisted(athleteId)) {
        await removeFromShortlist(athleteId);
      } else {
        await shortlistAthlete(athleteId);
      }
    },
    [isShortlisted, removeFromShortlist, shortlistAthlete],
  );

  const getUserForId = useCallback(
    (id: string): User | undefined => {
      return users.find((u) => u.id === id);
    },
    [users],
  );

  const matchedCount = dashboardData?.matchedAthletes?.length ?? recommendations.length;
  const shortlistCount = shortlist.length;
  const contactedCount = dashboardData?.contactedCount ?? 0;

  const renderAthleteCard = useCallback(
    ({ item }: { item: AIRecommendationRow }) => {
      const athlete = getUserForId(item.player_id);
      if (!athlete) return null;
      return (
        <AthleteMatchCard
          athlete={athlete}
          fitScore={item.fit_score}
          isShortlisted={isShortlisted(item.player_id)}
          onUserPress={handleUserPress}
          onShortlistToggle={handleShortlist}
          fitnessZone={athleteFitnessZones[athlete.id]}
        />
      );
    },
    [users, shortlist, handleUserPress, handleShortlist],
  );

  const ListHeader = useCallback(
    () => (
      <View>
        <ScoutStatsBar
          matchedCount={matchedCount}
          shortlistCount={shortlistCount}
          contactedCount={contactedCount}
        />
        <ScoutPrimaryActions
          onRefineMatches={() => router.push('/scout-preferences' as any)}
          onBrowseAll={() => router.push('/(tabs)/discover' as any)}
        />
        <View style={{ marginHorizontal: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
          <SectionHeader title="TOP MATCHES" count={recommendations.length} />
        </View>
      </View>
    ),
    [matchedCount, shortlistCount, contactedCount, recommendations.length],
  );

  const ListFooter = useCallback(
    () => (
      <ShortlistSection
        shortlist={shortlist}
        expanded={shortlistExpanded}
        onToggleExpand={() => setShortlistExpanded((prev) => !prev)}
        onUserPress={handleUserPress}
        getUserForId={getUserForId}
      />
    ),
    [shortlist, shortlistExpanded, handleUserPress, getUserForId],
  );

  if (loading && recommendations.length === 0) {
    return (
      <BgGradient style={styles.container}>
        <DashboardHeader title="SCOUT DASHBOARD" />
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      </BgGradient>
    );
  }

  return (
    <BgGradient style={styles.container}>
      <DashboardHeader title="SCOUT DASHBOARD" />
      <FlatList
        data={recommendations}
        renderItem={renderAthleteCard}
        keyExtractor={(item, index) => item.id || item.player_id || `rec-${index}`}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={
          <EmptyState
            icon={Award}
            title="Your next star is out there"
            subtitle="Set your scouting preferences and AI will surface athletes that match your criteria."
            ctaLabel="Set Preferences"
            onCTA={() => router.push('/scout-preferences' as any)}
          />
        }
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={ItemSeparator}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        {...FLATLIST_PERF_PROPS}
      />
    </BgGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: theme.spacing.xxl,
  },
});
