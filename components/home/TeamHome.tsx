import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import BgGradient from '@/components/BackgroundGradient';
import CachedImage from '@/components/CachedImage';
import { Briefcase, Users, FileText, Plus, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { theme } from '@/constants/theme';
import { User } from '@/types';
import { useScouting } from '@/hooks/scouting-context';
import { useAuth } from '@/hooks/auth-context';
import { useOpportunities } from '@/hooks/opportunities-context';
import { useAnalytics, EVENTS } from '@/hooks/useAnalytics';
import { FLATLIST_PERF_PROPS } from '@/constants/performance';

const ItemSeparator = () => <View style={{ height: theme.spacing.sm }} />;

export default function TeamHome() {
  const { user } = useAuth();
  const { getInterestedAthletesForOrg } = useScouting();
  const { opportunities, receivedApplications } = useOpportunities();
  const { track } = useAnalytics();

  const [roster, setRoster] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    track(EVENTS.SCREEN_VIEW, { screen: 'home_team' });
  }, []);

  useEffect(() => {
    if (user?.id) loadData();
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const athletes = await getInterestedAthletesForOrg(user.id);
      setRoster(athletes);
    } catch (e) {
      console.error('TeamHome: failed to load data', e);
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

  const myOpportunities = opportunities.filter((o) => o.teamId === user?.id);
  const totalApplications = receivedApplications.length;
  const oppsPosted = myOpportunities.length;

  const renderRosterItem = useCallback(
    ({ item }: { item: User }) => (
      <TouchableOpacity
        style={styles.rosterCard}
        onPress={() => handleUserPress(item.id)}
        activeOpacity={0.7}
      >
        <CachedImage source={item.avatar} size={40} placeholder="avatar" />
        <View style={{ flex: 1 }}>
          <Text style={styles.rosterName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.rosterMeta} numberOfLines={1} ellipsizeMode="tail">
            {item.sport?.toUpperCase() || 'ATHLETE'}{' '}
            {item.position ? `/ ${item.position.toUpperCase()}` : ''}
          </Text>
        </View>
        <ChevronRight size={16} color={theme.colors.textMuted} />
      </TouchableOpacity>
    ),
    [handleUserPress],
  );

  const ListHeader = () => (
    <View>
      {/* Stats Row */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue} numberOfLines={1}>
            {oppsPosted}
          </Text>
          <Text style={styles.statLabel} numberOfLines={1}>
            OPPS POSTED
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue} numberOfLines={1}>
            {totalApplications}
          </Text>
          <Text style={styles.statLabel} numberOfLines={1}>
            APPLICATIONS
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue} numberOfLines={1}>
            {roster.length}
          </Text>
          <Text style={styles.statLabel} numberOfLines={1}>
            INTERESTED
          </Text>
        </View>
      </View>

      {/* Manage Opportunities */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>MANAGE OPPORTUNITIES</Text>
        </View>
        <TouchableOpacity
          style={styles.manageOppsCard}
          onPress={() => router.push('/(tabs)/opportunities' as any)}
          activeOpacity={0.7}
        >
          <Briefcase size={20} color={theme.colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.manageOppsText} numberOfLines={1} ellipsizeMode="tail">
              VIEW ALL OPPORTUNITIES
            </Text>
            <Text style={styles.manageOppsSubtext} numberOfLines={1} ellipsizeMode="tail">
              {oppsPosted} active {oppsPosted === 1 ? 'opportunity' : 'opportunities'}
            </Text>
          </View>
          <ChevronRight size={18} color={theme.colors.textMuted} />
        </TouchableOpacity>

        {totalApplications > 0 && (
          <TouchableOpacity
            style={[styles.manageOppsCard, { marginTop: theme.spacing.sm }]}
            onPress={() => router.push('/(tabs)/opportunities' as any)}
            activeOpacity={0.7}
          >
            <FileText size={20} color="#FF9F0A" />
            <View style={{ flex: 1 }}>
              <Text style={styles.manageOppsText} numberOfLines={1} ellipsizeMode="tail">
                REVIEW APPLICATIONS
              </Text>
              <Text style={styles.manageOppsSubtext} numberOfLines={1} ellipsizeMode="tail">
                {totalApplications} pending{' '}
                {totalApplications === 1 ? 'application' : 'applications'}
              </Text>
            </View>
            <ChevronRight size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Post New Opportunity */}
      <TouchableOpacity
        style={styles.newOppButton}
        onPress={() => router.push('/opportunities/create' as any)}
        activeOpacity={0.7}
      >
        <Plus size={20} color="#0a0a0a" />
        <Text style={styles.newOppButtonText}>POST NEW OPPORTUNITY</Text>
      </TouchableOpacity>

      {/* Roster Header */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ROSTER</Text>
          {roster.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{roster.length}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <BgGradient style={styles.container}>
        <View style={styles.headerBar}>
          <View style={styles.headerAccent} />
          <Text style={styles.headerTitle}>TEAM DASHBOARD</Text>
        </View>
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      </BgGradient>
    );
  }

  return (
    <BgGradient style={styles.container}>
      <View style={styles.headerBar}>
        <View style={styles.headerAccent} />
        <Text style={styles.headerTitle}>TEAM DASHBOARD</Text>
      </View>
      <FlatList
        data={roster}
        renderItem={renderRosterItem}
        keyExtractor={(item, index) => item.id ?? `roster-${index}`}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Users size={40} color={theme.colors.textMuted} />
            <Text style={styles.emptyText}>No athletes in roster</Text>
            <Text style={styles.emptySubtext}>
              Athletes who are interested in your team will appear here
            </Text>
          </View>
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
    backgroundColor: '#30D158',
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

  // Stats
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 28, fontWeight: '900', color: '#30D158' },
  statLabel: { fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 1 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 4 },

  // Section
  sectionContainer: { marginHorizontal: theme.spacing.sm, marginBottom: theme.spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: '#30D158',
    paddingLeft: 12,
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

  // Manage Opps
  manageOppsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.08)',
    gap: theme.spacing.md,
  },
  manageOppsText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    letterSpacing: 1,
  },
  manageOppsSubtext: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },

  // New Opp Button
  newOppButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#30D158',
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  newOppButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.black,
    color: '#0a0a0a',
    letterSpacing: 1,
  },

  // Roster
  rosterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.sm,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.08)',
    gap: theme.spacing.sm,
  },
  rosterAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    flexShrink: 0,
  },
  rosterName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  rosterMeta: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    letterSpacing: 1,
    marginTop: 2,
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
