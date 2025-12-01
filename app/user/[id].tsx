import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
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
  FileText,
  ExternalLink
} from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { User, Post } from '@/types';
import * as Linking from 'expo-linking';
import { useScouting } from '@/hooks/scouting-context';
import { useAuth } from '@/hooks/auth-context';
import { useFollow } from '@/hooks/follow-context';
import { usePosts } from '@/hooks/posts-context';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';
import { Button } from '@/components/Button';
import { ScoutingSummaryModal } from '@/components/ScoutingSummaryModal';
import { ScoutInterestsCard } from '@/components/ScoutInterestsCard';
import { ProfileViewersCard } from '@/components/ProfileViewersCard';

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
  const { followUser, unfollowUser, isFollowing, getFollowersCount, getFollowingCount } = useFollow();
  const { posts } = usePosts();
  
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [postsViewMode, setPostsViewMode] = useState<'grid' | 'list'>('grid');
  const { getInterestedForPlayer, trackProfileView, getInterestedScoutsForAthlete, trackInterested, isInterested, removeInterest } = useScouting();
  const [aiInterestedScouts, setAiInterestedScouts] = useState<{ scoutName: string; score: number }[]>([]);
  const [scoutInterests, setScoutInterests] = useState<{
    scout_id: string;
    scout_name: string;
    scout_avatar?: string;
    scout_organization?: string;
    actions: string[];
  }[]>([]);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [showScoutingSummary, setShowScoutingSummary] = useState(false);
  const [isCurrentUserInterested, setIsCurrentUserInterested] = useState<boolean>(false);
  const [isInterestedLoading, setIsInterestedLoading] = useState(false);

  const loadUserProfile = async () => {
    if (!id || !isSupabaseConfigured) return;

    try {
      setIsLoading(true);
      
      // Load user profile
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, email, name, role, avatar, bio, location, verified, sport, position, achievements, stats, role_specific_data, resume_url, created_at')
        .eq('id', id)
        .single();

      if (userError) {
        console.error('Error loading user profile:', userError);
        Alert.alert('Error', 'Failed to load user profile');
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
          resumeUrl: userData.resume_url,
          createdAt: new Date(userData.created_at),
        };
        setProfileUser(user);

        // Load follow counts
        const [followersCountResult, followingCountResult] = await Promise.all([
          getFollowersCount(id),
          getFollowingCount(id)
        ]);
        setFollowersCount(followersCountResult);
        setFollowingCount(followingCountResult);
      }

      // Load user posts
      const filteredPosts = posts.filter(post => post.userId === id);
      setUserPosts(filteredPosts);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      Alert.alert('Error', 'Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUserProfile();
  }, [id, posts]);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      try {
        const res = await getInterestedForPlayer(id, 70);
        setAiInterestedScouts(res.map((x) => ({ scoutName: x.scout.name, score: x.rec.fit_score })));
      } catch (e) {
        console.log('UserProfile: interested load failed', e);
      }
    };
    void run();
  }, [id, getInterestedForPlayer]);

  useEffect(() => {
    const run = async () => {
      if (!id || !profileUser) return;
      
      if (profileUser.role === 'athlete') {
        try {
          const scouts = await getInterestedScoutsForAthlete(id);
          setScoutInterests(scouts);
        } catch (e) {
          console.log('UserProfile: scout interests load failed', e);
        }
      }
      
      if (currentUser && currentUser.id !== id) {
        try {
          const { error } = await supabase.rpc('track_profile_view', {
            p_profile_id: id,
            p_viewer_id: currentUser.id
          });
          if (error) {
            console.log('UserProfile: trackProfileView error', error);
          }
        } catch (e) {
          console.log('UserProfile: trackProfileView exception', e);
        }
      }
      
      if ((currentUser?.role === 'scout' || currentUser?.role === 'coach') && profileUser.role === 'athlete') {
        await trackProfileView(id);
        const isInterestedResult = await isInterested(id);
        setIsCurrentUserInterested(isInterestedResult);
      }
    };
    void run();
  }, [id, profileUser, currentUser, getInterestedScoutsForAthlete, trackProfileView, isInterested]);

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
          setFollowersCount(prev => prev - 1);
        }
      } else {
        const result = await followUser(profileUser.id);
        if (result.error) {
          Alert.alert('Error', result.error);
        } else {
          setFollowersCount(prev => prev + 1);
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
    router.push(`/chat/${profileUser.id}`);
  };

  const handleInterestedToggle = async () => {
    if (!profileUser) return;
    
    setIsInterestedLoading(true);
    try {
      if (isCurrentUserInterested) {
        await removeInterest(profileUser.id);
        setIsCurrentUserInterested(false);
      } else {
        await trackInterested(profileUser.id);
        setIsCurrentUserInterested(true);
      }
    } catch (error) {
      console.error('Interest toggle failed:', error);
      Alert.alert('Error', 'Failed to update interest status');
    } finally {
      setIsInterestedLoading(false);
    }
  };

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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
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

  const isOwnProfile = currentUser?.id === profileUser.id;
  const userIsFollowing = isFollowing(profileUser.id);

  const renderRoleSpecificDetails = (user: User) => {
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Cover Photo */}
        <View style={styles.coverContainer}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200' }}
            style={styles.coverImage}
          />
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ 
                uri: profileUser.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face' 
              }} 
              style={styles.avatar} 
            />
            <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(profileUser.role) }]}>
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
            {profileUser.sport || 'Sport'} • {profileUser.role.charAt(0).toUpperCase() + profileUser.role.slice(1)}
          </Text>
          <Text style={styles.bio}>{profileUser.bio || 'No bio available'}</Text>
          <Text style={styles.location}>{profileUser.location || 'Location not set'}</Text>
        </View>

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
              <Text style={styles.sectionTitle}>{profileUser.role.charAt(0).toUpperCase() + profileUser.role.slice(1)} Details</Text>
            </View>
            {renderRoleSpecificDetails(profileUser)}
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

        {/* CV/Resume Section */}
        {profileUser.resumeUrl && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FileText size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>CV / Resume</Text>
            </View>
            <TouchableOpacity 
              style={styles.resumeCard}
              onPress={() => {
                if (profileUser.resumeUrl) {
                  Linking.openURL(profileUser.resumeUrl).catch(err => {
                    console.error('Failed to open resume:', err);
                  });
                }
              }}
              testID="resume-view-button"
            >
              <View style={styles.resumeCardContent}>
                <FileText size={24} color={theme.colors.primary} />
                <View style={styles.resumeCardInfo}>
                  <Text style={styles.resumeCardTitle}>{profileUser.name}&apos;s Resume</Text>
                  <Text style={styles.resumeCardSubtitle}>Tap to view PDF</Text>
                </View>
              </View>
              <ExternalLink size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Scout Interests Card - for Athletes */}
        {profileUser.role === 'athlete' && (
          <ScoutInterestsCard userId={profileUser.id} isOwnProfile={isOwnProfile} />
        )}

        {/* Profile Views Card - only for own profile */}
        <ProfileViewersCard userId={profileUser.id} isOwnProfile={isOwnProfile} />

        {/* Interested Scouts for athletes (Legacy) */}
        {profileUser.role === 'athlete' && scoutInterests.length > 0 && false && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Flame size={20} color={theme.colors.success} />
              <Text style={styles.sectionTitle}>Scouts Interested in {profileUser?.name || 'Athlete'}</Text>
            </View>
            {scoutInterests.slice(0, 10).map((scout, idx) => (
              <TouchableOpacity
                key={`${scout.scout_id}-${idx}`}
                style={styles.scoutInterestItem}
                onPress={() => router.push(`/user/${scout.scout_id}`)}
              >
                <Image
                  source={{
                    uri: scout.scout_avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
                  }}
                  style={styles.scoutAvatar}
                />
                <View style={styles.scoutInfo}>
                  <Text style={styles.scoutName}>{scout.scout_name}</Text>
                  {scout.scout_organization && (
                    <Text style={styles.scoutOrganization}>{scout.scout_organization}</Text>
                  )}
                  <View style={styles.scoutActions}>
                    {scout.actions.map((action, actionIdx) => (
                      <View key={actionIdx} style={styles.actionBadge}>
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
        )}

        {/* AI-based Interested Scouts (Legacy fallback) */}
        {profileUser.role === 'athlete' && scoutInterests.length === 0 && aiInterestedScouts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Flame size={20} color={theme.colors.success} />
              <Text style={styles.sectionTitle}>Scouts Interested in {profileUser?.name || 'Athlete'}</Text>
            </View>
            {aiInterestedScouts.slice(0, 5).map((it, idx) => (
              <View key={`${it.scoutName}-${idx}`} style={styles.achievementItem}>
                <Star size={18} color={theme.colors.warning} />
                <View style={styles.achievementInfo}>
                  <Text style={styles.achievementTitle}>{it.scoutName}</Text>
                  <Text style={styles.achievementDescription}>Fit score {it.score}%</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Scouting Report Button */}
        {(profileUser.role === 'athlete' || profileUser.role === 'coach' || profileUser.role === 'trainer' || profileUser.role === 'scout') && (
          <View style={styles.scoutingReportSection}>
            <TouchableOpacity 
              style={styles.scoutingReportButton}
              onPress={() => setShowScoutingSummary(true)}
            >
              <FileText size={20} color={theme.colors.primary} />
              <View style={styles.scoutingReportContent}>
                <Text style={styles.scoutingReportTitle}>View Scouting Report</Text>
                <Text style={styles.scoutingReportSubtitle}>AI-generated professional assessment</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons */}
        {!isOwnProfile && (
          <View style={styles.actionButtons}>
            <Button
              title={userIsFollowing ? 'Unfollow' : 'Follow'}
              onPress={handleFollow}
              variant={userIsFollowing ? 'outline' : 'primary'}
              icon={userIsFollowing ? 
                <UserMinus size={16} color={theme.colors.primary} /> : 
                <UserPlus size={16} color={theme.colors.white} />
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
          </View>
        )}

        {/* Interested Button for Scouts/Coaches viewing Athletes */}
        {!isOwnProfile && (currentUser?.role === 'scout' || currentUser?.role === 'coach') && profileUser.role === 'athlete' && (
          <View style={styles.interestedButtonContainer}>
            <Button
              title={isCurrentUserInterested ? 'Interested ❤️' : 'Mark as Interested'}
              onPress={handleInterestedToggle}
              variant={isCurrentUserInterested ? 'primary' : 'outline'}
              style={styles.interestedButton}
              loading={isInterestedLoading}
            />
            <Text style={styles.interestedHint}>
              {isCurrentUserInterested 
                ? 'You marked this athlete as interested. They can see this.' 
                : 'Show this athlete you are interested in their profile'}
            </Text>
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
                <Grid size={16} color={postsViewMode === 'grid' ? theme.colors.primary : theme.colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.viewModeButton, postsViewMode === 'list' && styles.activeViewMode]}
                onPress={() => setPostsViewMode('list')}
              >
                <List size={16} color={postsViewMode === 'list' ? theme.colors.primary : theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          
          {userPosts.length > 0 ? (
            <View style={styles.postsGrid}>
              {userPosts.map((post) => (
                <TouchableOpacity key={post.id} style={styles.postItem}>
                  {post.media ? (
                    <Image source={{ uri: post.media.url }} style={styles.postImage} />
                  ) : (
                    <View style={styles.postTextContainer}>
                      <Text style={styles.postText} numberOfLines={3}>{post.content}</Text>
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
                {isOwnProfile ? 'Share your achievements and highlights' : `${profileUser.name} hasn't posted anything yet`}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Scouting Summary Modal */}
      <ScoutingSummaryModal
        visible={showScoutingSummary}
        onClose={() => setShowScoutingSummary(false)}
        user={profileUser}
      />
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
  resumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  resumeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  resumeCardInfo: {
    gap: 2,
  },
  resumeCardTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  resumeCardSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  scoutingReportSection: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  scoutingReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    gap: theme.spacing.md,
  },
  scoutingReportContent: {
    flex: 1,
  },
  scoutingReportTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  scoutingReportSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  scoutInterestItem: {
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
  scoutAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: theme.colors.warning,
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
  scoutActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  actionBadge: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  actionText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  interestedButtonContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  interestedButton: {
    width: '100%',
  },
  interestedHint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    lineHeight: 18,
  },
});