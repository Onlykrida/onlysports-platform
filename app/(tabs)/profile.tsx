import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackgroundGradient from '@/components/BackgroundGradient';
import { Settings, Edit3, Award, BarChart3, LogOut, Plus, Grid, List, Camera, Sparkles, BadgeCheck } from 'lucide-react-native';
import { theme, formatRoleName } from '@/constants/theme';
import { useAuth } from '@/hooks/auth-context';
import { useFollow } from '@/hooks/follow-context';
import { usePosts } from '@/hooks/posts-context';
import { mockAthletes } from '@/mocks/data';
import { User } from '@/types';
import { Button } from '@/components/Button';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useScouting, AIRecommendationRow } from '@/hooks/scouting-context';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useAuth();
  const { followers, following, getFollowersCount, getFollowingCount } = useFollow();
  const { posts, getLikedAthletes } = usePosts();
  const { getInterestedForPlayer, getTopForScout, getInterestedOrganizations } = useScouting();
  const [interested, setInterested] = useState<{ scoutName: string; score: number }[]>([]);
  const [interestedOrganizations, setInterestedOrganizations] = useState<User[]>([]);
  const [topPlayers, setTopPlayers] = useState<{ playerId: string; name: string; avatar?: string; position?: string; score: number }[]>([]);
  const [likedAthletes, setLikedAthletes] = useState<User[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [postsViewMode, setPostsViewMode] = useState<'grid' | 'list'>('grid');
  const [coverPhoto, setCoverPhoto] = useState<string>('https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200');
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [userPostsCount, setUserPostsCount] = useState(0);
  
  const loadCounts = async () => {
    if (!user) return;
    
    try {
      const [followersCountResult, followingCountResult] = await Promise.all([
        getFollowersCount(user.id),
        getFollowingCount(user.id)
      ]);
      setFollowersCount(followersCountResult);
      setFollowingCount(followingCountResult);
      
      // Count user's posts
      const userPosts = posts.filter(post => post.userId === user.id);
      setUserPostsCount(userPosts.length);
    } catch (error) {
      console.error('Failed to load counts:', error);
    }
  };

  React.useEffect(() => {
    loadCounts();
  }, [user, posts, followers, following]);

  const loadRecommendations = React.useCallback(async () => {
    if (!user) return;
    if (user.role === 'athlete') {
      try {
        const res = await getInterestedForPlayer(user.id, 70);
        setInterested(res.map((x) => ({ scoutName: x.scout.name, score: x.rec.fit_score })));
        
        const orgs = await getInterestedOrganizations(user.id);
        console.log('Profile: Interested organizations loaded', { count: orgs.length });
        setInterestedOrganizations(orgs);
      } catch (e) {
        console.log('Profile: interested scouts load failed', e);
      }
    } else if (user.role === 'scout' || user.role === 'coach' || user.role === 'academy' || user.role === 'team') {
      try {
        const recs = await getTopForScout(user.id, 10);
        const players = recs.map((r) => ({
          playerId: r.player_id,
          name: (mockAthletes.find(a => a.id === r.player_id)?.name) || 'Player',
          avatar: mockAthletes.find(a => a.id === r.player_id)?.avatar,
          position: mockAthletes.find(a => a.id === r.player_id)?.position,
          score: r.fit_score,
        }));
        setTopPlayers(players);
      } catch (e) {
        console.log('Profile: top players load failed', e);
      }

      try {
        const athletes = await getLikedAthletes(user.id);
        console.log('Profile: Liked athletes loaded', { count: athletes.length });
        setLikedAthletes(athletes);
      } catch (e) {
        console.log('Profile: liked athletes load failed', e);
      }
    }
  }, [user, getInterestedForPlayer, getTopForScout, getInterestedOrganizations, getLikedAthletes]);

  React.useEffect(() => {
    void loadRecommendations();
  }, [loadRecommendations]);

  React.useEffect(() => {
    if (!user || !isSupabaseConfigured) return;

    const channel = supabase
      .channel(`profile_realtime_${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ai_recommendations',
        filter: user.role === 'athlete' ? `player_id=eq.${user.id}` : `scout_id=eq.${user.id}`
      }, () => {
        console.log('Profile: AI recommendations changed, refreshing');
        void loadRecommendations();
      })
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
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        </SafeAreaView>
      </BackgroundGradient>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.replace('/welcome');
  };

  const pickProfileImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      console.error('Error picking profile image:', error);
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
        if (data.dateOfBirth) details.push({ label: 'Date of Birth', value: data.dateOfBirth, icon: '🎂' });
        if (data.currentTeam) details.push({ label: 'Current Team', value: data.currentTeam, icon: '🏆' });
        if (data.careerGoals) details.push({ label: 'Career Goals', value: data.careerGoals, icon: '🎯' });
        break;
      case 'scout':
        if (data.organization) details.push({ label: 'Organization', value: data.organization, icon: '🏢' });
        if (data.scoutingRegions && data.scoutingRegions.length > 0) {
          details.push({ label: 'Scouting Regions', value: data.scoutingRegions.join(', '), icon: '🌍' });
        }
        if (data.athleteLevels && data.athleteLevels.length > 0) {
          details.push({ label: 'Athlete Levels', value: data.athleteLevels.join(', '), icon: '👥' });
        }
        if (data.lookingFor) details.push({ label: 'Looking For', value: data.lookingFor, icon: '🔍' });
        break;
      case 'coach':
        if (data.experience) details.push({ label: 'Experience', value: data.experience, icon: '⏱️' });
        if (data.philosophy) details.push({ label: 'Philosophy', value: data.philosophy, icon: '💭' });
        if (data.teamHistory && data.teamHistory.length > 0) {
          details.push({ label: 'Team History', value: data.teamHistory.join(', '), icon: '🏆' });
        }
        break;
      case 'trainer':
        if (data.specialties && data.specialties.length > 0) {
          details.push({ label: 'Specialties', value: data.specialties.join(', '), icon: '💪' });
        }
        if (data.certifications && data.certifications.length > 0) {
          details.push({ label: 'Certifications', value: data.certifications.join(', '), icon: '🎓' });
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

  const pickCoverImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCoverPhoto(result.assets[0].uri);
        Alert.alert('Success', 'Cover photo updated!');
      }
    } catch (error) {
      console.error('Error picking cover image:', error);
      Alert.alert('Error', 'Failed to update cover photo');
    }
  };

  return (
    <BackgroundGradient style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={pickCoverImage} style={styles.coverImageContainer}>
            <Image
              source={{ uri: coverPhoto }}
              style={styles.coverImage}
            />
            <View style={styles.coverImageOverlay}>
              <Camera size={20} color={theme.colors.white} />
              <Text style={styles.coverImageText}>Change Cover</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.profileSection}>
            <TouchableOpacity onPress={pickProfileImage} style={styles.avatarContainer}>
              <Image 
                source={{ 
                  uri: user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face' 
                }} 
                style={styles.avatar} 
              />
              <View style={styles.avatarOverlay}>
                <Camera size={16} color={theme.colors.white} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => router.push('/edit-profile')}
            >
              <Edit3 size={16} color={theme.colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.nameSection}>
            <Text style={styles.name}>{user.name}</Text>
            {user.verified && <Text style={styles.verified}>✓</Text>}
          </View>
          <Text style={styles.role}>{formatRoleName(user.role)}{user.sport ? ` • ${user.sport}` : ''}{user.position ? ` • ${user.position}` : ''}</Text>
          <Text style={styles.bio}>{user.bio || 'No bio available'}</Text>
          <Text style={styles.location}>{user.location || 'Location not set'}</Text>
        </View>

        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statValue}>{followersCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statValue}>{followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statValue}>{userPostsCount}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Award size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Achievements</Text>
          </View>
          {user.achievements && user.achievements.length > 0 ? (
            user.achievements.map((achievement, index) => (
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

        {user.role === 'athlete' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <BadgeCheck size={20} color={theme.colors.success} />
              <Text style={styles.sectionTitle}>Organizations Interested in You</Text>
            </View>
            {interestedOrganizations.length > 0 ? (
              <>
                <View style={styles.interestSummary}>
                  <Text style={styles.interestSummaryText}>
                    {interestedOrganizations.length} {interestedOrganizations.length === 1 ? 'organization has' : 'organizations have'} expressed interest
                  </Text>
                </View>
                {interestedOrganizations.slice(0, 5).map((org, idx) => (
                  <TouchableOpacity 
                    key={`${org.id}-${idx}`} 
                    style={styles.achievementItem} 
                    testID={`interested-org-${idx}`}
                    onPress={() => router.push({ pathname: '/user/[id]' as any, params: { id: org.id } })}
                  >
                    <Image 
                      source={{ uri: org.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100' }} 
                      style={{ width: 40, height: 40, borderRadius: 20 }}
                    />
                    <View style={styles.achievementInfo}>
                      <Text style={styles.achievementTitle}>{org.name}</Text>
                      <Text style={styles.achievementDescription}>
                        {formatRoleName(org.role)}
                        {org.sport ? ` • ${org.sport}` : ''}
                        {org.roleSpecificData?.organization ? ` • ${org.roleSpecificData.organization}` : ''}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
                {interestedOrganizations.length > 5 && (
                  <Text style={styles.moreText}>+{interestedOrganizations.length - 5} more organizations</Text>
                )}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No organizations yet</Text>
                <Text style={styles.emptyStateSubtext}>Keep sharing your highlights to increase visibility</Text>
              </View>
            )}
          </View>
        )}

        {(user.role === 'scout' || user.role === 'coach' || user.role === 'academy' || user.role === 'team') && (
          <>
            {likedAthletes.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Sparkles size={20} color={theme.colors.warning} />
                  <Text style={styles.sectionTitle}>Players You Liked</Text>
                </View>
                <View style={styles.likedSummary}>
                  <Text style={styles.likedSummaryText}>
                    {likedAthletes.length} {likedAthletes.length === 1 ? 'athlete' : 'athletes'} you&apos;ve endorsed
                  </Text>
                </View>
                {likedAthletes.slice(0, 8).map((athlete, idx) => (
                  <TouchableOpacity
                    key={`liked-${athlete.id}-${idx}`}
                    style={styles.achievementItem}
                    testID={`liked-athlete-${idx}`}
                    onPress={() => router.push({ pathname: '/user/[id]' as any, params: { id: athlete.id } })}
                  >
                    <Image
                      source={{ uri: athlete.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100' }}
                      style={{ width: 40, height: 40, borderRadius: 20 }}
                    />
                    <View style={styles.achievementInfo}>
                      <Text style={styles.achievementTitle}>{athlete.name}</Text>
                      <Text style={styles.achievementDescription}>
                        {athlete.position || 'Athlete'}{athlete.sport ? ` • ${athlete.sport}` : ''}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
                {likedAthletes.length > 8 && (
                  <Text style={styles.moreText}>+{likedAthletes.length - 8} more athletes</Text>
                )}
              </View>
            )}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <BadgeCheck size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Recommended Athletes</Text>
              </View>
              {topPlayers.length > 0 ? (
                topPlayers.map((p, idx) => (
                  <TouchableOpacity key={`${p.playerId}-${idx}`} style={styles.achievementItem} onPress={() => router.push(`/user/${p.playerId}`)}>
                    <Image source={{ uri: p.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face' }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                    <View style={styles.achievementInfo}>
                      <Text style={styles.achievementTitle}>{p.name}</Text>
                      <Text style={styles.achievementDescription}>{p.position || 'Athlete'} • {p.score}% fit</Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No recommendations yet</Text>
                  <Text style={styles.emptyStateSubtext}>Athletes matching your sport will appear here</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Role-Specific Information */}
        {user.roleSpecificData && Object.keys(user.roleSpecificData).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <BadgeCheck size={20} color={theme.colors.secondary} />
              <Text style={styles.sectionTitle}>{formatRoleName(user.role)} Details</Text>
            </View>
            {renderRoleSpecificDetails()}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <BarChart3 size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Stats</Text>
          </View>
          <View style={styles.statsGrid}>
            {user.stats && Object.keys(user.stats).length > 0 ? (
              Object.entries(user.stats).map(([key, value]) => (
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

        <View style={styles.section}>
          <View style={styles.postsHeader}>
            <Text style={styles.sectionTitle}>Posts</Text>
            <View style={styles.postsActions}>
              <TouchableOpacity 
                style={[styles.viewModeButton, postsViewMode === 'grid' && styles.activeViewMode]}
                onPress={() => setPostsViewMode('grid')}
              >
                <Grid size={16} color={postsViewMode === 'grid' ? theme.colors.primary : theme.colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.viewModeButton, postsViewMode === 'list' && styles.activeViewMode]}
                onPress={() => setPostsViewMode('list')}
              >
                <List size={16} color={postsViewMode === 'list' ? theme.colors.primary : theme.colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.addPostButton}
                onPress={() => router.push('/create')}
              >
                <Plus size={16} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.postsContainer}>
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No posts yet</Text>
              <Text style={styles.emptyStateSubtext}>Share your achievements and highlights</Text>
              <TouchableOpacity 
                style={styles.createPostButton}
                onPress={() => router.push('/create')}
              >
                <Text style={styles.createPostText}>Create Your First Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Edit Profile"
            onPress={() => router.push('/edit-profile')}
            variant="outline"
            icon={<Edit3 size={16} color={theme.colors.primary} />}
          />
          <Button
            title="Settings"
            onPress={() => router.push('/settings')}
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
  coverImage: {
    width: '100%',
    height: 150,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: -40,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: theme.colors.primary,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: -10,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.sm,
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
    letterSpacing: 0.5,
  },
  verified: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.secondary,
  },
  role: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
    fontWeight: theme.fontWeight.bold,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
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
    fontWeight: theme.fontWeight.black,
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
    fontWeight: theme.fontWeight.bold,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
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
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  achievementIcon: {
    fontSize: 24,
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
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadow.glow,
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
    position: 'relative',
  },
  coverImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  coverImageText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
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
  likedSummary: {
    backgroundColor: theme.colors.warning + '15',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  likedSummaryText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.warning,
    textAlign: 'center',
  },
});