import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import BgGradient from '@/components/BackgroundGradient';
import CachedImage from '@/components/CachedImage';
import {
  Zap,
  MessageSquare,
  Send,
  Star,
  MoreVertical,
  Trophy,
  Target,
  Award,
  Flame,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { theme } from '@/constants/theme';
import { FLATLIST_PERF_PROPS } from '@/constants/performance';
import { Post, User } from '@/types';
import { usePosts } from '@/hooks/posts-context';
import { useAuth } from '@/hooks/auth-context';
import { useUsers } from '@/hooks/users-context';
import CommentsModal from '@/components/CommentsModal';
import ShareModal from '@/components/ShareModal';
import { useAnalytics, EVENTS } from '@/hooks/useAnalytics';
import VideoPlayer from '@/components/VideoPlayer';
import { PostSkeletonList } from '@/components/SkeletonScreens';

const { width } = Dimensions.get('window');

const getRelativeTime = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks}w`;
  return `${Math.floor(diffDays / 30)}mo`;
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

const ItemSeparator = () => <View style={styles.separator} />;

export default function FanHome() {
  const { posts, isLoading, refreshPosts, likePost, loadMore, isLoadingMore } = usePosts();
  const { user } = useAuth();
  const { users } = useUsers();
  const { track } = useAnalytics();

  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    track(EVENTS.SCREEN_VIEW, { screen: 'home_fan' });
  }, []);

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

  const handleCommentsPress = useCallback(
    (post: Post) => {
      track(EVENTS.POST_COMMENTED, { postId: post.id });
      setSelectedPost(post);
      setCommentsModalVisible(true);
    },
    [track],
  );

  const handleSharePress = useCallback((post: Post) => {
    setSelectedPost(post);
    setShareModalVisible(true);
  }, []);

  // Trending athletes: athletes sorted by follower count — memoized to avoid re-sorting on every render
  const trendingAthletes = useMemo(
    () =>
      users
        .filter((u) => u.role === 'athlete')
        .sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0))
        .slice(0, 10),
    [users],
  );

  const renderTrendingAthlete = (athlete: User) => (
    <TouchableOpacity
      key={athlete.id}
      style={styles.trendingCard}
      onPress={() => handleUserPress(athlete.id)}
      activeOpacity={0.7}
    >
      <CachedImage source={athlete.avatar} size={48} placeholder="avatar" />
      <Text style={styles.trendingName} numberOfLines={1}>
        {athlete.name}
      </Text>
      <Text style={styles.trendingSport} numberOfLines={1} ellipsizeMode="tail">
        {athlete.sport?.toUpperCase() || 'ATHLETE'}
      </Text>
    </TouchableOpacity>
  );

  const renderPost = useCallback(
    ({ item }: { item: Post }) => (
      <View style={styles.postContainer}>
        <View style={styles.postHeader}>
          <TouchableOpacity style={styles.userInfo} onPress={() => handleUserPress(item.userId)}>
            <View style={styles.avatarContainer}>
              <CachedImage source={item.userAvatar} size={40} placeholder="avatar" />
              <View
                style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(item.userRole) }]}
              >
                {getRoleIcon(item.userRole)}
              </View>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
                {item.userName}
              </Text>
              <View style={styles.roleContainer}>
                <Text
                  style={[styles.userRole, { color: getRoleBadgeColor(item.userRole) }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.userRole.toUpperCase()}
                </Text>
                <View style={styles.timestampDot} />
                <Text style={styles.postTime} numberOfLines={1} ellipsizeMode="tail">
                  {getRelativeTime(item.createdAt)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.postContent} numberOfLines={4} ellipsizeMode="tail">
          {item.content}
        </Text>

        {item.media && (
          <View style={styles.mediaContainer}>
            {item.media.type === 'image' ? (
              <CachedImage
                source={item.media.url}
                size={width - theme.spacing.md * 2}
                placeholder="post"
                style={{
                  height: (width - theme.spacing.md * 2) * 0.56,
                  borderRadius: theme.borderRadius.md,
                }}
              />
            ) : (
              <VideoPlayer
                uri={item.media.url ?? ''}
                poster={item.media.thumbnail}
                height={width * 0.56}
                width={width}
                autoPlay={false}
                loop={false}
                muted={false}
              />
            )}
          </View>
        )}

        <View style={styles.postActions}>
          <TouchableOpacity
            style={[styles.actionButton, item.isLiked && styles.likedButton]}
            onPress={() => {
              track(EVENTS.POST_LIKED, { postId: item.id });
              likePost(item.id);
            }}
          >
            <Zap
              size={18}
              color={item.isLiked ? theme.colors.primary : theme.colors.textMuted}
              fill={item.isLiked ? theme.colors.primary : 'transparent'}
            />
            <Text style={[styles.actionText, item.isLiked && styles.likedText]}>
              {item.likes} Power
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleCommentsPress(item)}>
            <MessageSquare size={18} color={theme.colors.textSecondary} />
            <Text style={styles.actionText}>{item.comments}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleSharePress(item)}>
            <Send size={18} color={theme.colors.textSecondary} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [user?.id, track, likePost],
  );

  const ListHeader = () => (
    <View>
      {/* Trending Athletes Horizontal */}
      {trendingAthletes.length > 0 && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TRENDING ATHLETES</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendingList}
          >
            {trendingAthletes.map(renderTrendingAthlete)}
          </ScrollView>
        </View>
      )}

      {/* Feed Header */}
      <View style={[styles.sectionContainer, { marginTop: theme.spacing.sm }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>YOUR FEED</Text>
        </View>
      </View>
    </View>
  );

  if (isLoading && posts.length === 0) {
    return (
      <BgGradient style={styles.container}>
        <View style={styles.headerBar}>
          <View style={styles.headerAccent} />
          <Text style={styles.headerTitle}>YOUR FEED</Text>
        </View>
        <PostSkeletonList />
      </BgGradient>
    );
  }

  return (
    <BgGradient style={styles.container}>
      <View style={styles.headerBar}>
        <View style={styles.headerAccent} />
        <Text style={styles.headerTitle}>YOUR FEED</Text>
      </View>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item, index) => item.id ?? `post-${index}`}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={ItemSeparator}
        {...FLATLIST_PERF_PROPS}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshPosts}
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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Trophy size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No highlights yet</Text>
            <Text style={styles.emptySubtext}>Follow athletes and coaches to see their posts</Text>
          </View>
        }
      />

      {selectedPost && (
        <CommentsModal
          visible={commentsModalVisible}
          onClose={() => {
            setCommentsModalVisible(false);
            setSelectedPost(null);
          }}
          postId={selectedPost.id}
          postAuthor={selectedPost.userName}
        />
      )}
      {selectedPost && (
        <ShareModal
          visible={shareModalVisible}
          onClose={() => {
            setShareModalVisible(false);
            setSelectedPost(null);
          }}
          post={selectedPost}
        />
      )}
    </BgGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingVertical: theme.spacing.sm },

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

  // Section
  sectionContainer: {
    marginHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
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

  // Trending
  trendingList: { paddingHorizontal: 0, gap: theme.spacing.sm },
  trendingCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    width: 100,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  trendingAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    flexShrink: 0,
  },
  trendingName: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  trendingSport: {
    fontSize: 8,
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
  },

  // Post
  postContainer: {
    backgroundColor: '#1a1a1a',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.sm,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  userInfo: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  avatarContainer: { position: 'relative', marginRight: theme.spacing.sm, flexShrink: 0 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  roleBadge: {
    position: 'absolute',
    bottom: -2,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: '#1a1a1a',
  },
  userDetails: { flex: 1 },
  userName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    marginBottom: 1,
    letterSpacing: 1,
  },
  roleContainer: { flexDirection: 'row', alignItems: 'center' },
  userRole: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.black, letterSpacing: 1 },
  timestampDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.colors.textMuted,
    marginHorizontal: theme.spacing.xs,
  },
  postTime: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted },
  postContent: {
    fontSize: theme.fontSize.md,
    color: '#888',
    lineHeight: 22,
    marginBottom: theme.spacing.md,
    fontWeight: theme.fontWeight.regular,
  },
  mediaContainer: {
    marginHorizontal: -theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  postImage: {
    width: width - theme.spacing.md * 2,
    height: (width - theme.spacing.md * 2) * 0.56,
    resizeMode: 'cover',
    borderRadius: theme.borderRadius.md,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: 5,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'transparent',
  },
  likedButton: { backgroundColor: 'transparent' },
  actionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    fontWeight: theme.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  likedText: { color: theme.colors.primary },

  separator: { height: theme.spacing.sm },
  footerLoader: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptySubtext: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
