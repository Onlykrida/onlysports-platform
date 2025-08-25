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
import { Settings, Edit3, Award, BarChart3, LogOut, Plus, Grid, List, Camera } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/auth-context';
import { useFollow } from '@/hooks/follow-context';
import { usePosts } from '@/hooks/posts-context';
import { mockAthletes } from '@/mocks/data';
import { Button } from '@/components/Button';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useAuth();
  const { followers, following, getFollowersCount, getFollowingCount } = useFollow();
  const { posts } = usePosts();
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCounts();
    setRefreshing(false);
  };
  
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
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
    <SafeAreaView style={styles.container}>
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
          <Text style={styles.role}>{user.sport || 'Athlete'} • {user.position || 'Player'}</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    borderColor: theme.colors.white,
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
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
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
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  createPostText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    textAlign: 'center',
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
});