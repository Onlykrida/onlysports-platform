import React, { useState, useMemo, useEffect } from 'react';
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
import BackgroundGradient from '@/components/BackgroundGradient';
import {
  Settings,
  Edit3,
  Award,
  BarChart3,
  LogOut,
  Plus,
  Grid,
  List,
  Camera,
  BadgeCheck,
  Target,
  Activity,
} from 'lucide-react-native';
import { theme, formatRoleName } from '@/constants/theme';
import { useAuth } from '@/hooks/auth-context';
import { useFollow } from '@/hooks/follow-context';
import { usePosts } from '@/hooks/posts-context';
import { User } from '@/types';
import { Button } from '@/components/Button';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useScouting } from '@/hooks/scouting-context';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';
import { ProfileSkeleton } from '@/components/SkeletonScreens';
import { useAnalytics, EVENTS } from '@/hooks/useAnalytics';
import { useFitnessTest } from '@/hooks/fitness-test-context';
import { FitnessTestCard } from '@/components/BeepTestCard';
import { getAgeGroup } from '@/constants/fitness-test-data';
import CachedImage from '@/components/CachedImage';
import AIProfileCoach from '@/components/AIProfileCoach';
import ProfileCompletion from '@/components/ProfileCompletion';
import ProfileViewers from '@/components/ProfileViewers';

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useAuth();
  const { followers, following, getFollowersCount, getFollowingCount } = useFollow();
  const { posts } = usePosts();
  const { getInterestedForPlayer, getInterestedOrganizations, getInterestedAthletesForOrg } =
    useScouting();
  const { track } = useAnalytics();
  const { latestByType, history: fitnessTestHistory } = useFitnessTest();
  const [interested, setInterested] = useState<{ scoutName: string; score: number }[]>([]);
  const [interestedOrganizations, setInterestedOrganizations] = useState<User[]>([]);
  const [topPlayers, setTopPlayers] = useState<
    { playerId: string; name: string; avatar?: string; position?: string; score: number }[]
  >([]);

  const [refreshing, setRefreshing] = useState(false);
  const [postsViewMode, setPostsViewMode] = useState<'grid' | 'list'>('grid');
  const userPosts = useMemo(() => posts.filter((p) => p.userId === user?.id), [posts, user?.id]);

  useEffect(() => {
    track(EVENTS.SCREEN_VIEW, { screen: 'profile' });
    track(EVENTS.PROFILE_VIEWED, { userId: user?.id });
  }, []);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [userPostsCount, setUserPostsCount] = useState(0);

  const loadCounts = React.useCallback(async () => {
    if (!user) return;

    try {
      const [followersCountResult, followingCountResult] = await Promise.all([
        getFollowersCount(user.id),
        getFollowingCount(user.id),
      ]);
      setFollowersCount(followersCountResult);
      setFollowingCount(followingCountResult);
      setUserPostsCount(userPosts.length);
    } catch (error) {
      if (__DEV__) console.error('Failed to load counts:', error);
    }
  }, [user?.id, userPosts.length, getFollowersCount, getFollowingCount]);

  React.useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  const loadRecommendations = React.useCallback(async () => {
    if (!user) return;
    if (user.role === 'athlete') {
      try {
        const res = await getInterestedForPlayer(user.id, 70);
        setInterested(res.map((x) => ({ scoutName: x.scout.name, score: x.rec.fit_score })));

        const orgs = await getInterestedOrganizations(user.id);
        if (__DEV__)
          console.log('Profile: Interested organizations loaded', { count: orgs.length });
        setInterestedOrganizations(orgs);
      } catch (e) {
        if (__DEV__) console.log('Profile: interested scouts load failed', e);
      }
    } else if (
      user.role === 'scout' ||
      user.role === 'coach' ||
      user.role === 'academy' ||
      user.role === 'team'
    ) {
      try {
        const athletes = await getInterestedAthletesForOrg(user.id);
        const players = athletes.map((a) => ({
          playerId: a.id,
          name: a.name,
          avatar: a.avatar,
          position: a.position,
          score: 85,
        }));
        if (__DEV__) console.log('Profile: Interested athletes loaded', { count: players.length });
        setTopPlayers(players);
      } catch (e) {
        if (__DEV__) console.log('Profile: interested athletes load failed', e);
      }
    }
  }, [user, getInterestedForPlayer, getInterestedOrganizations, getInterestedAthletesForOrg]);

  React.useEffect(() => {
    void loadRecommendations();
  }, [loadRecommendations]);

  React.useEffect(() => {
    if (!user || !isSupabaseConfigured) return;

    const channel = supabase
      .channel(`profile_realtime_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_recommendations',
          filter: user.role === 'athlete' ? `player_id=eq.${user.id}` : `scout_id=eq.${user.id}`,
        },
        () => {
          if (__DEV__) console.log('Profile: AI recommendations changed, refreshing');
          void loadRecommendations();
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, loadRecommendations]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCounts();
    setRefreshing(false);
  };

  if (!user) {
    return (
      <BackgroundGradient style={styles.container}>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
          <ProfileSkeleton />
        </SafeAreaView>
      </BackgroundGradient>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/welcome' as any);
  };

  const pickProfileImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        const updateResult = await updateProfile({ avatar: imageUri });
        if (updateResult.error) {
          Alert.alert('Error', updateResult.error);
        } else {
          Alert.alert('Success', 'Profile picture updated!');
        }
      }
    } catch (error) {
      if (__DEV__) console.error('Error picking profile image:', error);
      Alert.alert('Error', 'Failed to update profile picture');
    }
  };

  const renderRoleSpecificDetails = () => {
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
              <Text style={styles.roleDetailLabel} numberOfLines={1} ellipsizeMode="tail">
                {detail.label}
              </Text>
              <Text style={styles.roleDetailValue} numberOfLines={2} ellipsizeMode="tail">
                {detail.value}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <BackgroundGradient style={styles.container}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.header}>
            <View style={styles.coverImageContainer}>
              <View style={styles.coverGradient} />
            </View>
            <View style={styles.profileSection}>
              <TouchableOpacity
                onPress={pickProfileImage}
                style={styles.avatarContainer}
                accessibilityRole="button"
                accessibilityLabel="Change profile picture"
                accessibilityHint="Opens image picker to select a new profile picture"
              >
                <CachedImage source={user.avatar} size={100} placeholder="avatar" />
                <View style={styles.avatarOverlay}>
                  <Camera size={16} color={theme.colors.white} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.nameSection}>
              <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
                {user.name}
              </Text>
              {user.verified && <Text style={styles.verified}>✓</Text>}
            </View>
            <Text style={styles.role} numberOfLines={1} ellipsizeMode="tail">
              {formatRoleName(user.role)}
              {user.sport ? ` • ${user.sport}` : ''}
              {user.position ? ` • ${user.position}` : ''}
            </Text>
            <Text style={styles.bio} numberOfLines={2} ellipsizeMode="tail">
              {user.bio || 'No bio available'}
            </Text>
            <Text style={styles.location} numberOfLines={1} ellipsizeMode="tail">
              {user.location || 'Location not set'}
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <TouchableOpacity
              style={styles.statItem}
              accessibilityRole="button"
              accessibilityLabel={`${followersCount} followers`}
            >
              <Text style={styles.statValue} numberOfLines={1}>
                {followersCount}
              </Text>
              <Text style={styles.statLabel} numberOfLines={1}>
                Followers
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statItem}
              accessibilityRole="button"
              accessibilityLabel={`${followingCount} following`}
            >
              <Text style={styles.statValue} numberOfLines={1}>
                {followingCount}
              </Text>
              <Text style={styles.statLabel} numberOfLines={1}>
                Following
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statItem}
              accessibilityRole="button"
              accessibilityLabel={`${userPostsCount} posts`}
            >
              <Text style={styles.statValue} numberOfLines={1}>
                {userPostsCount}
              </Text>
              <Text style={styles.statLabel} numberOfLines={1}>
                Posts
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Award size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle} numberOfLines={1}>
                Achievements
              </Text>
            </View>
            {user.achievements && user.achievements.length > 0 ? (
              user.achievements.map((achievement, index) => (
                <View key={achievement.id || index} style={styles.achievementItem}>
                  <Text style={styles.achievementIcon}>{achievement.icon || '🏆'}</Text>
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementTitle} numberOfLines={1} ellipsizeMode="tail">
                      {achievement.title}
                    </Text>
                    <Text
                      style={styles.achievementDescription}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {achievement.description}
                    </Text>
                    <Text style={styles.achievementDate} numberOfLines={1} ellipsizeMode="tail">
                      {achievement.date}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No achievements yet</Text>
              </View>
            )}
          </View>

          {user.role === 'athlete' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <BadgeCheck size={20} color={theme.colors.success} />
                <Text style={styles.sectionTitle} numberOfLines={1}>
                  Organizations Interested in You
                </Text>
              </View>
              {interestedOrganizations.length > 0 ? (
                <>
                  <View style={styles.interestSummary}>
                    <Text style={styles.interestSummaryText}>
                      {interestedOrganizations.length}{' '}
                      {interestedOrganizations.length === 1
                        ? 'organization has'
                        : 'organizations have'}{' '}
                      expressed interest
                    </Text>
                  </View>
                  {interestedOrganizations.slice(0, 5).map((org, idx) => (
                    <TouchableOpacity
                      key={`${org.id}-${idx}`}
                      style={styles.achievementItem}
                      testID={`interested-org-${idx}`}
                      onPress={() =>
                        router.push({ pathname: '/user/[id]' as any, params: { id: org.id } })
                      }
                    >
                      <CachedImage source={org.avatar} size={40} placeholder="avatar" />
                      <View style={styles.achievementInfo}>
                        <Text
                          style={styles.achievementTitle}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {org.name}
                        </Text>
                        <Text
                          style={styles.achievementDescription}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {formatRoleName(org.role)}
                          {org.sport ? ` • ${org.sport}` : ''}
                          {org.roleSpecificData?.organization
                            ? ` • ${org.roleSpecificData.organization}`
                            : ''}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  {interestedOrganizations.length > 5 && (
                    <Text style={styles.moreText}>
                      +{interestedOrganizations.length - 5} more organizations
                    </Text>
                  )}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No organizations yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Keep sharing your highlights to increase visibility
                  </Text>
                </View>
              )}
            </View>
          )}

          {(user.role === 'scout' ||
            user.role === 'coach' ||
            user.role === 'academy' ||
            user.role === 'team') && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <BadgeCheck size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitle} numberOfLines={1}>
                  Players You're Interested In
                </Text>
              </View>
              {topPlayers.length > 0 ? (
                topPlayers.map((p, idx) => (
                  <TouchableOpacity
                    key={`${p.playerId}-${idx}`}
                    style={styles.achievementItem}
                    onPress={() => router.push(`/user/${p.playerId}` as any)}
                  >
                    <CachedImage source={p.avatar} size={40} placeholder="avatar" />
                    <View style={styles.achievementInfo}>
                      <Text style={styles.achievementTitle} numberOfLines={1} ellipsizeMode="tail">
                        {p.name}
                      </Text>
                      <Text
                        style={styles.achievementDescription}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {p.position || 'Athlete'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No interests yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Visit athlete profiles and express interest to see them here
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Role-Specific Information */}
          {user.roleSpecificData && Object.keys(user.roleSpecificData).length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <BadgeCheck size={20} color={theme.colors.secondary} />
                <Text style={styles.sectionTitle} numberOfLines={1}>
                  {formatRoleName(user.role)} Details
                </Text>
              </View>
              {renderRoleSpecificDetails()}
            </View>
          )}

          {/* Who Viewed Your Profile — #1 engagement driver */}
          {user.role === 'athlete' && <ProfileViewers userId={user.id} />}

          {/* Profile Completion */}
          <ProfileCompletion user={user} postsCount={userPosts.length} />

          {/* AI Profile Coach */}
          <AIProfileCoach />

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <BarChart3 size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle} numberOfLines={1}>
                Stats
              </Text>
            </View>
            <View style={styles.statsGrid}>
              {user.stats && Object.keys(user.stats).length > 0 ? (
                Object.entries(user.stats).map(([key, value]) => (
                  <View key={key} style={styles.statCard}>
                    <Text style={styles.statCardValue} numberOfLines={1} ellipsizeMode="tail">
                      {String(value)}
                    </Text>
                    <Text style={styles.statCardLabel} numberOfLines={1} ellipsizeMode="tail">
                      {key}
                    </Text>
                  </View>
                ))
              ) : (
                <TouchableOpacity
                  style={styles.emptyState}
                  onPress={() => router.push('/player-stats' as any)}
                  accessibilityRole="button"
                  accessibilityLabel="Add your stats"
                >
                  <Text style={styles.emptyStateText}>No stats available</Text>
                  <Text style={styles.emptyStateSubtext}>Tap to add your stats</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.postsHeader}>
              <Text style={styles.sectionTitle}>Posts</Text>
              <View style={styles.postsActions}>
                <TouchableOpacity
                  style={[styles.viewModeButton, postsViewMode === 'grid' && styles.activeViewMode]}
                  onPress={() => setPostsViewMode('grid')}
                  accessibilityRole="button"
                  accessibilityLabel="Grid view"
                  accessibilityState={{ selected: postsViewMode === 'grid' }}
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
                  accessibilityRole="button"
                  accessibilityLabel="List view"
                  accessibilityState={{ selected: postsViewMode === 'list' }}
                >
                  <List
                    size={16}
                    color={
                      postsViewMode === 'list' ? theme.colors.primary : theme.colors.textSecondary
                    }
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addPostButton}
                  onPress={() => router.push('/(tabs)/create' as any)}
                  accessibilityRole="button"
                  accessibilityLabel="Create new post"
                >
                  <Plus size={16} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.postsContainer}>
              {userPosts.length > 0 ? (
                postsViewMode === 'grid' ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
                    {userPosts.map((post) => {
                      // Prefer the thumbnail (always an image) over .url (may be
                      // a video URL for highlight posts). Strip device-local URIs
                      // that don't resolve cross-platform (legacy data from a
                      // pre-fix upload regression — see posts-context upload helper).
                      const rawSrc = post.media?.thumbnail || post.media?.url;
                      const gridSrc =
                        rawSrc && !rawSrc.startsWith('file://') && !rawSrc.startsWith('content://')
                          ? rawSrc
                          : null;
                      return (
                        <TouchableOpacity
                          key={post.id}
                          style={{
                            width: '32.8%',
                            aspectRatio: 1,
                            backgroundColor: theme.colors.surface,
                            borderRadius: 4,
                            overflow: 'hidden',
                          }}
                          onPress={() => router.push(`/post/${post.id}` as any)}
                        >
                          {gridSrc ? (
                            <CachedImage
                              source={gridSrc}
                              size={100}
                              placeholder="post"
                              style={{ width: '100%', height: '100%' }}
                            />
                          ) : (
                            <View
                              style={{
                                flex: 1,
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: 8,
                              }}
                            >
                              <Text
                                style={{ color: theme.colors.textSecondary, fontSize: 12 }}
                                numberOfLines={3}
                              >
                                {post.content}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <View style={{ gap: 12 }}>
                    {userPosts.map((post) => (
                      <TouchableOpacity
                        key={post.id}
                        style={{
                          backgroundColor: theme.colors.surface,
                          borderRadius: 8,
                          padding: 12,
                        }}
                        onPress={() => router.push(`/post/${post.id}` as any)}
                      >
                        <Text style={{ color: theme.colors.text, fontSize: 14 }} numberOfLines={2}>
                          {post.content}
                        </Text>
                        <Text
                          style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 4 }}
                        >
                          {post.likes} likes · {post.comments} comments
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No posts yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Share your achievements and highlights
                  </Text>
                  <TouchableOpacity
                    style={styles.createPostButton}
                    onPress={() => router.push('/(tabs)/create' as any)}
                    accessibilityRole="button"
                    accessibilityLabel="Create your first post"
                  >
                    <Text style={styles.createPostText}>Create Your First Post</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Scouting Actions */}
          {user.role === 'athlete' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Activity size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitle} numberOfLines={1}>
                  Performance
                </Text>
              </View>
              <Button
                title="Edit My Stats"
                onPress={() => router.push('/player-stats' as any)}
                variant="outline"
                icon={<Activity size={16} color={theme.colors.primary} />}
              />
            </View>
          )}

          {/* Fitness Assessment */}
          {user.role === 'athlete' && (
            <View style={styles.section}>
              <FitnessTestCard
                variant={Object.keys(latestByType).length > 0 ? 'athlete' : 'empty'}
                latestByType={latestByType}
                history={fitnessTestHistory}
                gender={(user?.roleSpecificData as any)?.gender || 'male'}
                ageGroup={getAgeGroup((user?.roleSpecificData as any)?.dateOfBirth)}
                onTakeTest={() => router.push('/beep-test' as any)}
                onViewHistory={() =>
                  router.push({
                    pathname: '/beep-test-history' as any,
                    params: { athleteId: user.id, athleteName: user.name },
                  })
                }
              />
            </View>
          )}

          {(user.role === 'scout' ||
            user.role === 'coach' ||
            user.role === 'team' ||
            user.role === 'academy') && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Target size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitle} numberOfLines={1}>
                  Scouting
                </Text>
              </View>
              <Button
                title="Scouting Preferences"
                onPress={() => router.push('/scout-preferences' as any)}
                variant="outline"
                icon={<Target size={16} color={theme.colors.primary} />}
              />
            </View>
          )}

          {['team', 'coach', 'scout', 'gym', 'academy', 'brand'].includes(user.role) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <BarChart3 size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitle} numberOfLines={1}>
                  Management
                </Text>
              </View>
              <Button
                title="Team Dashboard"
                onPress={() => router.push('/team-dashboard' as any)}
                variant="outline"
                icon={<BarChart3 size={16} color={theme.colors.primary} />}
              />
            </View>
          )}

          <View style={styles.actions}>
            <Button
              title="Edit Profile"
              onPress={() => router.push('/edit-profile' as any)}
              variant="outline"
              icon={<Edit3 size={16} color={theme.colors.primary} />}
            />
            <Button
              title="Settings"
              onPress={() => router.push('/settings' as any)}
              variant="outline"
              icon={<Settings size={16} color={theme.colors.primary} />}
            />
            <Button
              title="Logout"
              onPress={handleLogout}
              variant="ghost"
              icon={<LogOut size={16} color={theme.colors.danger} />}
              textStyle={{ color: theme.colors.danger }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  header: {
    position: 'relative',
  },
  profileSection: {
    alignItems: 'center',
    marginTop: -36,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: theme.colors.primary,
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
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    textTransform: 'uppercase' as const,
    letterSpacing: 2,
  },
  verified: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.secondary,
  },
  role: {
    fontSize: theme.fontSize.md,
    color: theme.colors.accent,
    marginTop: theme.spacing.xs,
    fontWeight: theme.fontWeight.bold,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  bio: {
    fontSize: theme.fontSize.sm,
    color: '#888',
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
    borderColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: theme.spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 30,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: '#888',
    marginTop: theme.spacing.xs,
    fontWeight: theme.fontWeight.semibold,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.5,
  },
  section: {
    padding: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
    paddingLeft: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.5,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    backgroundColor: '#1a1a1a',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  achievementIcon: {
    fontSize: 24,
    flexShrink: 0,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
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
    backgroundColor: '#1a1a1a',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statCardValue: {
    fontSize: 28,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.primary,
  },
  statCardLabel: {
    fontSize: theme.fontSize.xs,
    color: '#888',
    marginTop: theme.spacing.xs,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  postsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
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
  addPostButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  postsContainer: {
    minHeight: 100,
  },
  createPostButton: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    shadowColor: '#30D158',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  createPostText: {
    color: theme.colors.black,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.black,
    textAlign: 'center',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  emptyStateSubtext: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  actions: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  emptyStateText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  coverImageContainer: {
    height: 120,
  },
  coverGradient: {
    flex: 1,
    backgroundColor: '#1a2a1a',
    borderBottomLeftRadius: theme.borderRadius.md,
    borderBottomRightRadius: theme.borderRadius.md,
  },
  roleDetailsContainer: {
    gap: theme.spacing.sm,
  },
  roleDetailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    backgroundColor: '#1a1a1a',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed' as const,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  roleDetailIcon: {
    fontSize: 20,
    flexShrink: 0,
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
  avatarContainer: {
    position: 'relative',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.xs,
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  interestSummary: {
    backgroundColor: theme.colors.primary + '15',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  interestSummaryText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  moreText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    fontStyle: 'italic' as const,
  },
});
