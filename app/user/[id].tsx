import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import {
  ArrowLeft,
  MessageCircle,
  UserPlus,
  UserMinus,
  Trophy,
  Target,
  Award,
  Flame,
  Star,
  Grid,
  List,
  TrendingUp,
  Send,
  Edit,
  CheckCircle,
  Zap,
} from 'lucide-react-native';
import { theme, formatRoleName } from '@/constants/theme';
import { User } from '@/types';
import { useScouting } from '@/hooks/scouting-context';
import { useAuth } from '@/hooks/auth-context';
import { useFollow } from '@/hooks/follow-context';
import { useNotifications } from '@/hooks/notifications-context';
import { usePosts } from '@/hooks/posts-context';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';
import { Button } from '@/components/Button';
import { useAnalytics, EVENTS } from '@/hooks/useAnalytics';
import VideoPlayer from '@/components/VideoPlayer';
import { useFitnessTest } from '@/hooks/fitness-test-context';
import { FitnessTestCard } from '@/components/BeepTestCard';
import { getAgeGroup } from '@/constants/fitness-test-data';
import { FitnessTestResult, FitnessTestType } from '@/types';
import CachedImage from '@/components/CachedImage';
import { UserProfileSkeleton } from '@/components/SkeletonScreens';

const getRoleIcon = (role: string) => {
  switch (role.toLowerCase()) {
    case 'athlete':
      return <Trophy size={14} color={theme.colors.primary} />;
    case 'coach':
      return <Target size={14} color={theme.colors.success} />;
    case 'scout':
      return <Award size={14} color={theme.colors.warning} />;
    case 'team':
      return <Flame size={14} color={theme.colors.danger} />;
    default:
      return <Star size={14} color={theme.colors.textSecondary} />;
  }
};

const getRoleBadgeColor = (role: string) => {
  switch (role.toLowerCase()) {
    case 'athlete':
      return theme.colors.primary;
    case 'coach':
      return theme.colors.success;
    case 'scout':
      return theme.colors.warning;
    case 'team':
      return theme.colors.danger;
    default:
      return theme.colors.textSecondary;
  }
};

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const { followUser, unfollowUser, isFollowing, getFollowersCount, getFollowingCount } =
    useFollow();
  const { posts } = usePosts();

  const userPosts = useMemo(() => posts.filter((p) => p.userId === id), [posts, id]);

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [postsViewMode, setPostsViewMode] = useState<'grid' | 'list'>('grid');
  const {
    getInterestedForPlayer,
    expressInterest,
    removeInterest,
    hasExpressedInterest: checkInterest,
    getInterestedOrganizations,
    getInterestedAthletesForOrg,
  } = useScouting();
  const [interested, setInterested] = useState<{ scoutName: string; score: number }[]>([]);
  const [recommendedAthletes, setRecommendedAthletes] = useState<User[]>([]);

  const { createNotification } = useNotifications();
  const [isInterestLoading, setIsInterestLoading] = useState(false);
  const hasExpressedInterest = checkInterest(id || '');
  const [interestedOrganizations, setInterestedOrganizations] = useState<User[]>([]);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const { track } = useAnalytics();
  const { fetchLatestForAthlete, fetchHistoryForAthlete } = useFitnessTest();
  const [fitnessLatestByType, setFitnessLatestByType] = useState<
    Partial<Record<FitnessTestType, FitnessTestResult>>
  >({});
  const [fitnessTestHistory, setFitnessTestHistory] = useState<FitnessTestResult[]>([]);

  useEffect(() => {
    if (id) {
      track(EVENTS.PROFILE_VIEWED, { viewedUserId: id });
      // Record profile view for "Who Viewed Your Profile" feature
      if (currentUser?.id && currentUser.id !== id && isSupabaseConfigured) {
        supabase
          .from('profile_views')
          .insert({
            profile_id: id,
            viewer_id: currentUser.id,
          })
          .then(() => {});
      }
    }
  }, [id]);

  const loadUserProfile = React.useCallback(async () => {
    if (!id || !isSupabaseConfigured) return;

    try {
      setIsLoading(true);

      if (__DEV__) console.log('UserProfileScreen: loading profile', { id });

      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select(
          'id, email, name, role, avatar, bio, location, verified, sport, position, achievements, stats, role_specific_data, created_at',
        )
        .eq('id', id)
        .maybeSingle();

      if (userError) {
        console.error('Error loading user profile:', userError);
        Alert.alert('Error', 'Failed to load user profile');
        return;
      }

      if (!userData) {
        if (__DEV__) console.log('UserProfileScreen: User not found in database:', id);
        setProfileUser(null);
        setIsLoading(false);
        return;
      }

      if (userData) {
        const user: User = {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          avatar: userData.avatar,
          bio: userData.bio,
          location: userData.location,
          verified: userData.verified,
          sport: userData.sport,
          position: userData.position,
          achievements: userData.achievements || [],
          stats: userData.stats || {},
          roleSpecificData: userData.role_specific_data || {},
          createdAt: new Date(userData.created_at),
        };
        setProfileUser(user);

        const [followersCountResult, followingCountResult] = await Promise.all([
          getFollowersCount(id),
          getFollowingCount(id),
        ]);

        setFollowersCount(followersCountResult);
        setFollowingCount(followingCountResult);
      }

      if (userData?.role === 'athlete') {
        if (__DEV__) console.log('UserProfile: Loading interested organizations for athlete', id);
        const [orgs, fitnessHist] = await Promise.all([
          getInterestedOrganizations(id),
          fetchHistoryForAthlete(id),
        ]);
        if (__DEV__)
          console.log('UserProfile: Interested organizations loaded', { count: orgs.length, orgs });
        setInterestedOrganizations(orgs);
        // Build latestByType map from history
        const byType: Partial<Record<FitnessTestType, FitnessTestResult>> = {};
        for (const r of fitnessHist) {
          if (
            !byType[r.test_type] ||
            new Date(r.test_date) > new Date(byType[r.test_type]!.test_date)
          ) {
            byType[r.test_type] = r;
          }
        }
        setFitnessLatestByType(byType);
        setFitnessTestHistory(fitnessHist);
      }

      if (userData?.role && ['coach', 'scout', 'team', 'academy'].includes(userData.role)) {
        if (__DEV__) console.log('UserProfile: Loading interested athletes for organization', id);
        try {
          const athletes = await getInterestedAthletesForOrg(id);
          if (__DEV__)
            console.log('UserProfile: Interested athletes loaded', { count: athletes.length });
          setRecommendedAthletes(athletes);
        } catch (e) {
          if (__DEV__) console.log('UserProfile: interested athletes load failed', e);
        }
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      Alert.alert('Error', 'Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  }, [
    getFollowersCount,
    getFollowingCount,
    id,
    getInterestedOrganizations,
    getInterestedAthletesForOrg,
  ]);

  useEffect(() => {
    void loadUserProfile();
  }, [loadUserProfile]);

  const loadInterestedScouts = React.useCallback(async () => {
    if (!id) return;
    try {
      const res = await getInterestedForPlayer(id, 70);
      setInterested(
        res
          .filter((x) => x.scout != null)
          .map((x) => ({ scoutName: x.scout?.name ?? 'Unknown', score: x.rec.fit_score })),
      );
    } catch (e) {
      if (__DEV__) console.log('UserProfile: interested load failed', e);
    }
  }, [id, getInterestedForPlayer]);

  useEffect(() => {
    void loadInterestedScouts();
  }, [loadInterestedScouts]);

  useEffect(() => {
    if (!id || !isSupabaseConfigured || !profileUser || profileUser.role !== 'athlete') return;

    const channel = supabase
      .channel(`profile_changes_${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_recommendations',
          filter: `player_id=eq.${id}`,
        },
        async () => {
          if (__DEV__) console.log('UserProfile: AI recommendation changed, refreshing');
          void loadInterestedScouts();
          const orgs = await getInterestedOrganizations(id);
          setInterestedOrganizations(orgs);
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [id, profileUser, loadInterestedScouts, getInterestedOrganizations]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserProfile();
    setRefreshing(false);
  };

  const handleFollow = async () => {
    if (!profileUser || !currentUser) return;

    setIsFollowLoading(true);
    try {
      if (isFollowing(profileUser.id)) {
        const result = await unfollowUser(profileUser.id);
        if (result.error) {
          Alert.alert('Error', result.error);
        } else {
          setFollowersCount((prev) => prev - 1);
        }
      } else {
        const result = await followUser(profileUser.id);
        if (result.error) {
          Alert.alert('Error', result.error);
        } else {
          setFollowersCount((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error('Follow action failed:', error);
      Alert.alert('Error', 'Failed to update follow status');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleMessage = () => {
    if (!profileUser) return;
    router.push({ pathname: '/chat/[id]' as any, params: { id: profileUser.id } });
  };

  const handleExpressInterest = async () => {
    if (!profileUser || !currentUser) return;

    setIsInterestLoading(true);
    try {
      if (hasExpressedInterest) {
        if (__DEV__)
          console.log('UserProfile: Removing interest', { profileUserId: profileUser.id });
        const result = await removeInterest(profileUser.id);
        if (result.error) {
          Alert.alert('Error', result.error);
        } else {
          if (__DEV__) console.log('UserProfile: Interest removed, updating UI');
          setInterestedOrganizations((prev) => prev.filter((org) => org.id !== currentUser.id));
          Alert.alert('Success', 'Interest removed');
        }
      } else {
        if (__DEV__)
          console.log('UserProfile: Expressing interest', {
            profileUserId: profileUser.id,
            currentUserId: currentUser.id,
          });
        const result = await expressInterest(profileUser.id);
        if (result.error) {
          Alert.alert('Error', result.error);
        } else {
          if (__DEV__)
            console.log('UserProfile: Interest expressed, updating UI and sending notification');
          setInterestedOrganizations((prev) => {
            const exists = prev.some((org) => org.id === currentUser.id);
            if (exists) return prev;
            return [currentUser, ...prev];
          });

          const orgTypeLabel =
            currentUser.role === 'coach'
              ? 'Coach'
              : currentUser.role === 'scout'
                ? 'Scout'
                : currentUser.role === 'team'
                  ? 'Team'
                  : currentUser.role === 'academy'
                    ? 'Academy'
                    : 'Organization';

          const sportInfo = currentUser.sport ? ` (${currentUser.sport})` : '';
          const orgName = currentUser.roleSpecificData?.organization
            ? ` from ${currentUser.roleSpecificData.organization}`
            : '';

          await createNotification(
            profileUser.id,
            'connection_request',
            `${orgTypeLabel}${sportInfo} Interested in Your Profile`,
            `${currentUser.name}${orgName} is interested in your athletic profile. This could be a great opportunity!`,
            { userId: currentUser.id, userRole: currentUser.role, userSport: currentUser.sport },
          );

          Alert.alert(
            'Interest Expressed!',
            `${profileUser.name} has been notified of your interest. You can now message them directly.`,
            [{ text: 'OK' }, { text: 'Message Now', onPress: handleMessage }],
          );
        }
      }
    } catch (error) {
      console.error('Interest action failed:', error);
      Alert.alert('Error', 'Failed to update interest status');
    } finally {
      setIsInterestLoading(false);
    }
  };

  const handleUpdateProfile = () => {
    router.push('/edit-profile' as any);
  };

  const handleShareHighlights = () => {
    router.push('/(tabs)/create' as any);
  };

  // All hooks must be called before any early return to maintain consistent hook call order.
  const isOwnProfile = currentUser?.id === profileUser?.id;
  const userIsFollowing = isFollowing(profileUser?.id || '');

  const interestedOrganizationGroups = useMemo(() => {
    const scouts: User[] = [];
    const organizations: User[] = [];
    const countByRole: Record<string, number> = {};
    for (const org of interestedOrganizations) {
      countByRole[org.role] = (countByRole[org.role] ?? 0) + 1;
      if (org.role === 'scout') {
        scouts.push(org);
      } else if (['coach', 'team', 'academy'].includes(org.role)) {
        organizations.push(org);
      }
    }
    return {
      scouts,
      organizations,
      totalInterest: scouts.length + organizations.length,
      countByRole,
    };
  }, [interestedOrganizations]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Profile',
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                <ArrowLeft size={24} color={theme.colors.text} />
              </TouchableOpacity>
            ),
          }}
        />
        <UserProfileSkeleton />
      </SafeAreaView>
    );
  }

  if (!profileUser) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Profile',
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                <ArrowLeft size={24} color={theme.colors.text} />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const canExpressInterest =
    !isOwnProfile &&
    currentUser &&
    ['coach', 'scout', 'team', 'academy'].includes(currentUser.role) &&
    profileUser.role === 'athlete';

  const renderRoleSpecificDetails = (user: User) => {
    if (!user?.roleSpecificData) return null;

    const data = user.roleSpecificData;
    const details: { label: string; value: string; icon: string }[] = [];

    switch (user.role) {
      case 'athlete':
        if (data.height) details.push({ label: 'Height', value: data.height, icon: '📏' });
        if (data.weight) details.push({ label: 'Weight', value: data.weight, icon: '⚖️' });
        if (data.dateOfBirth)
          details.push({ label: 'Date of Birth', value: data.dateOfBirth, icon: '🎂' });
        if (data.currentTeam)
          details.push({ label: 'Current Team', value: data.currentTeam, icon: '🏆' });
        if (data.careerGoals)
          details.push({ label: 'Career Goals', value: data.careerGoals, icon: '🎯' });
        break;
      case 'scout':
        if (data.organization)
          details.push({ label: 'Organization', value: data.organization, icon: '🏢' });
        if (data.scoutingRegions && data.scoutingRegions.length > 0) {
          details.push({
            label: 'Scouting Regions',
            value: data.scoutingRegions.join(', '),
            icon: '🌍',
          });
        }
        if (data.athleteLevels && data.athleteLevels.length > 0) {
          details.push({
            label: 'Athlete Levels',
            value: data.athleteLevels.join(', '),
            icon: '👥',
          });
        }
        if (data.lookingFor)
          details.push({ label: 'Looking For', value: data.lookingFor, icon: '🔍' });
        break;
      case 'coach':
        if (data.experience)
          details.push({ label: 'Experience', value: data.experience, icon: '⏱️' });
        if (data.philosophy)
          details.push({ label: 'Philosophy', value: data.philosophy, icon: '💭' });
        if (data.teamHistory && data.teamHistory.length > 0) {
          details.push({ label: 'Team History', value: data.teamHistory.join(', '), icon: '🏆' });
        }
        break;
      case 'trainer':
        if (data.specialties && data.specialties.length > 0) {
          details.push({ label: 'Specialties', value: data.specialties.join(', '), icon: '💪' });
        }
        if (data.certifications && data.certifications.length > 0) {
          details.push({
            label: 'Certifications',
            value: data.certifications.join(', '),
            icon: '🎓',
          });
        }
        break;
    }

    return (
      <View style={styles.roleDetailsContainer}>
        {details.map((detail, index) => (
          <View key={index} style={styles.roleDetailItem}>
            <Text style={styles.roleDetailIcon}>{detail.icon}</Text>
            <View style={styles.roleDetailInfo}>
              <Text style={styles.roleDetailLabel}>{detail.label}</Text>
              <Text style={styles.roleDetailValue}>{detail.value}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: profileUser.name,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <ArrowLeft size={24} color={theme.colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Cover Photo */}
        <View style={styles.coverContainer}>
          <CachedImage
            source={'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200'}
            size={400}
            placeholder="cover"
            style={styles.coverImage}
          />
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <CachedImage source={profileUser.avatar} size={100} placeholder="avatar" />
            <View
              style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(profileUser.role) }]}
            >
              {getRoleIcon(profileUser.role)}
            </View>
          </View>
        </View>

        {/* User Info */}
        <View style={styles.infoSection}>
          <View style={styles.nameSection}>
            <Text style={styles.name}>{profileUser.name}</Text>
            {profileUser.verified && <Text style={styles.verified}>✓</Text>}
          </View>
          <Text style={styles.role}>
            {profileUser.sport || 'Sport'} • {formatRoleName(profileUser.role)}
          </Text>
          <Text style={styles.bio}>{profileUser.bio || 'No bio available'}</Text>
          <Text style={styles.location}>{profileUser.location || 'Location not set'}</Text>
        </View>

        {/* Interest Signal Section - Visible to everyone on athlete profiles */}
        {profileUser.role === 'athlete' &&
          (() => {
            const { scouts, organizations, totalInterest, countByRole } =
              interestedOrganizationGroups;
            return (
              <View style={styles.interestSection}>
                <View style={styles.interestHeader}>
                  <Zap size={24} color={theme.colors.warning} />
                  <Text style={styles.interestTitle}>Interest & Visibility</Text>
                </View>

                {totalInterest > 0 ? (
                  <>
                    <View style={styles.interestCard}>
                      <View style={styles.interestCount}>
                        <Text style={styles.interestCountNumber}>{totalInterest}</Text>
                        <Text style={styles.interestCountLabel}>
                          {totalInterest === 1 ? 'party has' : 'parties have'} shown interest
                        </Text>
                      </View>

                      {scouts.length > 0 && (
                        <View style={styles.interestCategorySection}>
                          <View style={styles.interestCategoryHeader}>
                            <Award size={18} color={theme.colors.warning} />
                            <Text style={styles.interestCategoryTitle}>
                              Scouts Interested ({scouts.length})
                            </Text>
                          </View>
                          <View style={styles.interestedOrgDetailsList}>
                            {scouts.slice(0, 5).map((scout) => (
                              <TouchableOpacity
                                key={scout.id}
                                style={styles.interestedOrgDetailItem}
                                onPress={() =>
                                  router.push({
                                    pathname: '/user/[id]' as any,
                                    params: { id: scout.id },
                                  })
                                }
                              >
                                <CachedImage source={scout.avatar} size={40} placeholder="avatar" />
                                <View style={styles.interestedOrgDetailInfo}>
                                  <View style={styles.interestedOrgDetailNameRow}>
                                    <Text style={styles.interestedOrgDetailName}>{scout.name}</Text>
                                    {scout.verified && <Text style={styles.verified}>✓</Text>}
                                  </View>
                                  <View style={styles.interestedOrgDetailMeta}>
                                    <View
                                      style={[
                                        styles.interestedOrgDetailRoleBadge,
                                        { backgroundColor: getRoleBadgeColor('scout') + '30' },
                                      ]}
                                    >
                                      {getRoleIcon('scout')}
                                      <Text
                                        style={[
                                          styles.interestedOrgDetailRole,
                                          { color: getRoleBadgeColor('scout') },
                                        ]}
                                      >
                                        {formatRoleName('scout')}
                                      </Text>
                                    </View>
                                    {scout.roleSpecificData?.organization && (
                                      <Text
                                        style={styles.interestedOrgDetailTeam}
                                        numberOfLines={1}
                                      >
                                        {scout.roleSpecificData.organization}
                                      </Text>
                                    )}
                                  </View>
                                  {scout.sport && (
                                    <Text style={styles.interestedOrgDetailSport}>
                                      {scout.sport}
                                    </Text>
                                  )}
                                </View>
                              </TouchableOpacity>
                            ))}
                            {scouts.length > 5 && (
                              <View style={styles.interestedOrgDetailMore}>
                                <Text style={styles.interestedOrgDetailMoreText}>
                                  +{scouts.length - 5} more{' '}
                                  {scouts.length - 5 === 1 ? 'scout' : 'scouts'}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      )}

                      {organizations.length > 0 && (
                        <View style={styles.interestCategorySection}>
                          <View style={styles.interestCategoryHeader}>
                            <Flame size={18} color={theme.colors.primary} />
                            <Text style={styles.interestCategoryTitle}>
                              Organizations Interested ({organizations.length})
                            </Text>
                          </View>
                          <View style={styles.interestedOrgDetailsList}>
                            {organizations.slice(0, 5).map((org) => (
                              <TouchableOpacity
                                key={org.id}
                                style={styles.interestedOrgDetailItem}
                                onPress={() =>
                                  router.push({
                                    pathname: '/user/[id]' as any,
                                    params: { id: org.id },
                                  })
                                }
                              >
                                <CachedImage source={org.avatar} size={40} placeholder="avatar" />
                                <View style={styles.interestedOrgDetailInfo}>
                                  <View style={styles.interestedOrgDetailNameRow}>
                                    <Text style={styles.interestedOrgDetailName}>{org.name}</Text>
                                    {org.verified && <Text style={styles.verified}>✓</Text>}
                                  </View>
                                  <View style={styles.interestedOrgDetailMeta}>
                                    <View
                                      style={[
                                        styles.interestedOrgDetailRoleBadge,
                                        {
                                          backgroundColor:
                                            getRoleBadgeColor(org.role || 'coach') + '30',
                                        },
                                      ]}
                                    >
                                      {getRoleIcon(org.role || 'coach')}
                                      <Text
                                        style={[
                                          styles.interestedOrgDetailRole,
                                          { color: getRoleBadgeColor(org.role || 'coach') },
                                        ]}
                                      >
                                        {org.role ? formatRoleName(org.role) : 'Organization'}
                                      </Text>
                                    </View>
                                    {org.roleSpecificData?.organization && (
                                      <Text
                                        style={styles.interestedOrgDetailTeam}
                                        numberOfLines={1}
                                      >
                                        {org.roleSpecificData.organization}
                                      </Text>
                                    )}
                                  </View>
                                  {org.sport && (
                                    <Text style={styles.interestedOrgDetailSport}>{org.sport}</Text>
                                  )}
                                </View>
                              </TouchableOpacity>
                            ))}
                            {organizations.length > 5 && (
                              <View style={styles.interestedOrgDetailMore}>
                                <Text style={styles.interestedOrgDetailMoreText}>
                                  +{organizations.length - 5} more{' '}
                                  {organizations.length - 5 === 1
                                    ? 'organization'
                                    : 'organizations'}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      )}

                      <View style={styles.orgTypeBreakdown}>
                        {['scout', 'coach', 'team', 'academy'].map((role) => {
                          const count = countByRole[role] ?? 0;
                          if (count === 0) return null;
                          return (
                            <View key={role} style={styles.orgTypeChip}>
                              {getRoleIcon(role)}
                              <Text style={styles.orgTypeChipText}>
                                {count} {formatRoleName(role, count > 1)}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    <View style={styles.trustBanner}>
                      <CheckCircle size={16} color={theme.colors.success} />
                      <Text style={styles.trustBannerText}>
                        Only verified coaches and organizations can express interest
                      </Text>
                    </View>

                    {isOwnProfile && (
                      <View style={styles.actionGuidesSection}>
                        <Text style={styles.actionGuidesTitle}>Recommended Next Steps</Text>
                        <TouchableOpacity
                          style={styles.actionGuideCard}
                          onPress={handleShareHighlights}
                        >
                          <View
                            style={[
                              styles.actionGuideIcon,
                              { backgroundColor: theme.colors.primary + '20' },
                            ]}
                          >
                            <Send size={20} color={theme.colors.primary} />
                          </View>
                          <View style={styles.actionGuideContent}>
                            <Text style={styles.actionGuideLabel}>Share Latest Highlights</Text>
                            <Text style={styles.actionGuideDesc}>
                              Post your recent performances
                            </Text>
                          </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.actionGuideCard}
                          onPress={handleUpdateProfile}
                        >
                          <View
                            style={[
                              styles.actionGuideIcon,
                              { backgroundColor: theme.colors.info + '20' },
                            ]}
                          >
                            <Edit size={20} color={theme.colors.info} />
                          </View>
                          <View style={styles.actionGuideContent}>
                            <Text style={styles.actionGuideLabel}>Update Your Stats</Text>
                            <Text style={styles.actionGuideDesc}>Keep your profile current</Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                ) : isOwnProfile ? (
                  <View style={styles.emptyInterestState}>
                    <View style={styles.emptyInterestIcon}>
                      <TrendingUp size={32} color={theme.colors.textSecondary} />
                    </View>
                    <Text style={styles.emptyInterestTitle}>Build Your Visibility</Text>
                    <Text style={styles.emptyInterestDesc}>
                      Coaches and scouts will discover your profile. Keep sharing highlights and
                      updating your stats to increase your visibility.
                    </Text>
                    <TouchableOpacity
                      style={styles.emptyInterestAction}
                      onPress={handleShareHighlights}
                    >
                      <Text style={styles.emptyInterestActionText}>Share Your First Highlight</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.emptyInterestState}>
                    <View style={styles.emptyInterestIcon}>
                      <TrendingUp size={32} color={theme.colors.textSecondary} />
                    </View>
                    <Text style={styles.emptyInterestTitle}>No interest expressed yet</Text>
                    <Text style={styles.emptyInterestDesc}>
                      Scouts, coaches, and organizations haven't expressed interest yet.
                    </Text>
                  </View>
                )}
              </View>
            );
          })()}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{followersCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userPosts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
        </View>

        {/* Achievements Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Trophy size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Achievements</Text>
          </View>
          {profileUser.achievements && profileUser.achievements.length > 0 ? (
            profileUser.achievements.map((achievement, index) => (
              <View key={achievement.id || index} style={styles.achievementItem}>
                <Text style={styles.achievementIcon}>{achievement.icon || '🏆'}</Text>
                <View style={styles.achievementInfo}>
                  <Text style={styles.achievementTitle}>{achievement.title}</Text>
                  <Text style={styles.achievementDescription}>{achievement.description}</Text>
                  <Text style={styles.achievementDate}>{achievement.date}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No achievements yet</Text>
            </View>
          )}
        </View>

        {/* Role-specific Information */}
        {profileUser.roleSpecificData && Object.keys(profileUser.roleSpecificData).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Award size={20} color={theme.colors.secondary} />
              <Text style={styles.sectionTitle}>{formatRoleName(profileUser.role)} Details</Text>
            </View>
            {renderRoleSpecificDetails(profileUser)}
          </View>
        )}

        {/* Fitness Assessment - visible to scouts/coaches/teams/academies viewing athletes */}
        {profileUser.role === 'athlete' && Object.keys(fitnessLatestByType).length > 0 && (
          <View style={styles.section}>
            <FitnessTestCard
              variant="scout"
              latestByType={fitnessLatestByType}
              history={fitnessTestHistory}
              gender={(profileUser?.roleSpecificData as any)?.gender || 'male'}
              ageGroup={getAgeGroup((profileUser?.roleSpecificData as any)?.dateOfBirth)}
              onViewHistory={() =>
                router.push({
                  pathname: '/beep-test-history' as any,
                  params: { athleteId: profileUser.id, athleteName: profileUser.name },
                })
              }
            />
          </View>
        )}

        {/* Stats Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Target size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Stats</Text>
          </View>
          <View style={styles.statsGrid}>
            {profileUser.stats && Object.keys(profileUser.stats).length > 0 ? (
              Object.entries(profileUser.stats).map(([key, value]) => (
                <View key={key} style={styles.statCard}>
                  <Text style={styles.statCardValue}>{String(value)}</Text>
                  <Text style={styles.statCardLabel}>{key}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No stats available</Text>
              </View>
            )}
          </View>
        </View>

        {/* Players Interested In for scouts/coaches/organizations */}
        {['coach', 'scout', 'team', 'academy'].includes(profileUser.role) &&
          recommendedAthletes.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Star size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Players Interested In</Text>
              </View>
              <View style={styles.recommendedAthletesList}>
                {recommendedAthletes.slice(0, 5).map((athlete) => (
                  <TouchableOpacity
                    key={athlete.id}
                    style={styles.recommendedAthleteItem}
                    onPress={() =>
                      router.push({ pathname: '/user/[id]' as any, params: { id: athlete.id } })
                    }
                  >
                    <CachedImage source={athlete.avatar} size={40} placeholder="avatar" />
                    <View style={styles.recommendedAthleteInfo}>
                      <View style={styles.recommendedAthleteNameRow}>
                        <Text style={styles.recommendedAthleteName}>{athlete.name}</Text>
                        {athlete.verified && <Text style={styles.verified}>✓</Text>}
                      </View>
                      <View style={styles.recommendedAthleteMeta}>
                        {athlete.sport && (
                          <Text style={styles.recommendedAthleteSport}>{athlete.sport}</Text>
                        )}
                        {athlete.position && (
                          <Text style={styles.recommendedAthletePosition}>
                            • {athlete.position}
                          </Text>
                        )}
                      </View>
                      {athlete.roleSpecificData?.currentTeam && (
                        <Text style={styles.recommendedAthleteTeam} numberOfLines={1}>
                          🏆 {athlete.roleSpecificData.currentTeam}
                        </Text>
                      )}
                    </View>
                    <View style={styles.recommendedAthleteAction}>
                      <Star size={16} color={theme.colors.primary} fill={theme.colors.primary} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

        {/* Action Buttons */}
        {!isOwnProfile && (
          <View style={styles.actionButtons}>
            {canExpressInterest ? (
              <>
                <Button
                  title={hasExpressedInterest ? 'Interest Expressed' : 'Interested in this Athlete'}
                  onPress={handleExpressInterest}
                  variant={hasExpressedInterest ? 'outline' : 'primary'}
                  icon={
                    hasExpressedInterest ? (
                      <CheckCircle size={16} color={theme.colors.success} />
                    ) : (
                      <Star size={16} color={theme.colors.white} />
                    )
                  }
                  style={styles.actionButtonFull}
                  loading={isInterestLoading}
                />
                <Button
                  title="Message"
                  onPress={handleMessage}
                  variant="outline"
                  icon={<MessageCircle size={16} color={theme.colors.primary} />}
                  style={styles.actionButtonFull}
                />
              </>
            ) : (
              <>
                <Button
                  title={userIsFollowing ? 'Unfollow' : 'Follow'}
                  onPress={handleFollow}
                  variant={userIsFollowing ? 'outline' : 'primary'}
                  icon={
                    userIsFollowing ? (
                      <UserMinus size={16} color={theme.colors.primary} />
                    ) : (
                      <UserPlus size={16} color={theme.colors.white} />
                    )
                  }
                  style={styles.actionButton}
                  loading={isFollowLoading}
                />
                <Button
                  title="Message"
                  onPress={handleMessage}
                  variant="outline"
                  icon={<MessageCircle size={16} color={theme.colors.primary} />}
                  style={styles.actionButton}
                />
              </>
            )}
          </View>
        )}

        {/* Posts Section */}
        <View style={styles.postsSection}>
          <View style={styles.postsHeader}>
            <Text style={styles.sectionTitle}>Posts</Text>
            <View style={styles.postsActions}>
              <TouchableOpacity
                style={[styles.viewModeButton, postsViewMode === 'grid' && styles.activeViewMode]}
                onPress={() => setPostsViewMode('grid')}
              >
                <Grid
                  size={16}
                  color={
                    postsViewMode === 'grid' ? theme.colors.primary : theme.colors.textSecondary
                  }
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewModeButton, postsViewMode === 'list' && styles.activeViewMode]}
                onPress={() => setPostsViewMode('list')}
              >
                <List
                  size={16}
                  color={
                    postsViewMode === 'list' ? theme.colors.primary : theme.colors.textSecondary
                  }
                />
              </TouchableOpacity>
            </View>
          </View>

          {userPosts.length > 0 ? (
            <View style={styles.postsGrid}>
              {userPosts.map((post) => (
                <TouchableOpacity
                  key={post.id}
                  style={styles.postItem}
                  onPress={() =>
                    router.push({ pathname: '/post/[id]' as any, params: { id: post.id } })
                  }
                >
                  {post.media ? (
                    post.media.type === 'video' ? (
                      <VideoPlayer
                        uri={post.media.url}
                        poster={post.media.thumbnail}
                        height={120}
                        width="100%"
                        autoPlay={false}
                        loop={false}
                        muted={true}
                        testID={`profile-video-${post.id}`}
                      />
                    ) : (
                      <CachedImage
                        source={post.media.url}
                        size={100}
                        placeholder="post"
                        style={styles.postImage}
                      />
                    )
                  ) : (
                    <View style={styles.postTextContainer}>
                      <Text style={styles.postText} numberOfLines={3}>
                        {post.content}
                      </Text>
                    </View>
                  )}
                  <View style={styles.postOverlay}>
                    <Text style={styles.postLikes}>{post.likes} ⚡</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No posts yet</Text>
              <Text style={styles.emptyStateSubtext}>
                {isOwnProfile
                  ? 'Share your achievements and highlights'
                  : `${profileUser.name} hasn't posted anything yet`}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerButton: {
    padding: theme.spacing.sm,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.lg,
    fontSize: theme.fontSize.lg,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  errorText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.danger,
    fontWeight: theme.fontWeight.medium,
  },
  coverContainer: {
    height: 150,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  profileSection: {
    alignItems: 'center',
    marginTop: -40,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: theme.colors.white,
  },
  roleBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  infoSection: {
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  name: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  verified: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.secondary,
  },
  role: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
  },
  bio: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    lineHeight: 20,
  },
  location: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  actionButtonFull: {
    flex: 1,
  },
  interestSection: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  interestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  interestTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  interestCard: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  interestCount: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  interestCountNumber: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.warning,
    marginBottom: theme.spacing.xs,
  },
  interestCountLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  interestedOrgDetailsList: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  interestedOrgDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.md,
  },
  interestedOrgDetailAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  interestedOrgDetailInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  interestedOrgDetailNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  interestedOrgDetailName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  interestedOrgDetailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  interestedOrgDetailRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
  },
  interestedOrgDetailRole: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  interestedOrgDetailTeam: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  interestedOrgDetailSport: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  interestedOrgDetailMore: {
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
  },
  interestedOrgDetailMoreText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  interestCategorySection: {
    marginBottom: theme.spacing.lg,
  },
  interestCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  interestCategoryTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  orgTypeBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  orgTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  orgTypeChipText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.success + '15',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  trustBannerText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.success,
    lineHeight: 18,
  },
  actionGuidesSection: {
    gap: theme.spacing.sm,
  },
  actionGuidesTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  actionGuideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  actionGuideIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionGuideContent: {
    flex: 1,
  },
  actionGuideLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  actionGuideDesc: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  emptyInterestState: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyInterestIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  emptyInterestTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyInterestDesc: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  emptyInterestAction: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  emptyInterestActionText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  postsSection: {
    padding: theme.spacing.md,
  },
  postsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  postsActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  viewModeButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  activeViewMode: {
    backgroundColor: theme.colors.primary + '20',
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  postItem: {
    width: '32%',
    aspectRatio: 1,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postTextContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    justifyContent: 'center',
  },
  postText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text,
    textAlign: 'center',
  },
  postOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: theme.spacing.xs,
  },
  postLikes: {
    color: theme.colors.white,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyStateText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  emptyStateSubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    padding: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  achievementIcon: {
    fontSize: 24,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  achievementDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  achievementDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  statCardValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  statCardLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  roleDetailsContainer: {
    gap: theme.spacing.sm,
  },
  roleDetailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  roleDetailIcon: {
    fontSize: 20,
  },
  roleDetailInfo: {
    flex: 1,
  },
  roleDetailLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  roleDetailValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  recommendedAthletesList: {
    gap: theme.spacing.sm,
  },
  recommendedAthleteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.md,
  },
  recommendedAthleteAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  recommendedAthleteInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  recommendedAthleteNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  recommendedAthleteName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  recommendedAthleteMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    flexWrap: 'wrap',
  },
  recommendedAthleteSport: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  recommendedAthletePosition: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  recommendedAthleteTeam: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  recommendedAthleteAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  likedSummary: {
    backgroundColor: theme.colors.danger + '12',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  likedSummaryText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.danger,
    textAlign: 'center',
  },
  likedMoreContainer: {
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  likedMoreText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic' as const,
  },
});
