import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import BgGradient from '@/components/BackgroundGradient';
import { Trophy } from 'lucide-react-native';
import { router } from 'expo-router';
import { useOpportunities } from '@/hooks/opportunities-context';
import { theme } from '@/constants/theme';
import { FLATLIST_PERF_PROPS } from '@/constants/performance';
import { Post, User } from '@/types';
import { useScouting } from '@/hooks/scouting-context';
import { usePosts } from '@/hooks/posts-context';
import { useAuth } from '@/hooks/auth-context';
import CommentsModal from '@/components/CommentsModal';
import ShareModal from '@/components/ShareModal';
import PostActionsMenu from '@/components/PostActionsMenu';
import EditPostModal from '@/components/EditPostModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useAnalytics, EVENTS } from '@/hooks/useAnalytics';
import PostCard from '@/components/home/shared/PostCard';
import WhoIsWatchingSection from '@/components/home/athlete/WhoIsWatchingSection';
import AthleteStatsBar from '@/components/home/athlete/AthleteStatsBar';
import AthleteQuickActions from '@/components/home/athlete/AthleteQuickActions';
import AthleteFeedHeader from '@/components/home/athlete/AthleteFeedHeader';

const ItemSeparator = () => <View style={styles.separator} />;

export default function AthleteHome() {
  const {
    posts,
    isLoading,
    refreshPosts,
    likePost,
    deletePost,
    updatePost,
    loadMore,
    hasMore,
    isLoadingMore,
  } = usePosts();
  const { user } = useAuth();
  const { getInterestedOrganizations, topRecommendations } = useScouting();
  const { applyToOpportunity } = useOpportunities();
  const { track } = useAnalytics();

  const [interestedOrgs, setInterestedOrgs] = useState<User[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    track(EVENTS.SCREEN_VIEW, { screen: 'home_athlete' });
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadInterestedOrgs();
    }
  }, [user?.id]);

  const loadInterestedOrgs = async () => {
    if (!user?.id) return;
    setLoadingOrgs(true);
    try {
      const orgs = await Promise.race([
        getInterestedOrganizations(user.id),
        new Promise<User[]>((resolve) => setTimeout(() => resolve([]), 5000)),
      ]);
      setInterestedOrgs(orgs);
    } catch (e) {
      if (__DEV__) console.error('Failed to load interested orgs:', e);
    } finally {
      setLoadingOrgs(false);
    }
  };

  const handleDeletePost = useCallback(
    async (postId: string) => {
      const result = await deletePost(postId);
      if (result.error) if (__DEV__) console.error('Failed to delete post:', result.error);
    },
    [deletePost],
  );

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

  const openMenu = useCallback((post: Post) => {
    setSelectedPost(post);
    setMenuVisible(true);
  }, []);

  const handleSaveToggle = useCallback((postId: string) => {
    setSavedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) newSet.delete(postId);
      else newSet.add(postId);
      return newSet;
    });
  }, []);

  const handleApplyToOpportunity = useCallback(
    async (opportunityId: string) => {
      if (!user) {
        alert('Please log in to apply');
        return;
      }
      if (user.role !== 'athlete') {
        alert('Only athletes can apply to opportunities');
        return;
      }
      const actualId = opportunityId.replace('opp-', '');
      const { error } = await applyToOpportunity(actualId);
      if (error) alert(`Error: ${error}`);
      else {
        alert('Application submitted successfully!');
        await refreshPosts();
      }
    },
    [user, applyToOpportunity, refreshPosts],
  );

  const onRefresh = async () => {
    await Promise.all([refreshPosts(), loadInterestedOrgs()]);
  };

  // Stats data — fetched from real sources
  const [profileViews, setProfileViews] = useState(0);
  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured) return;
    supabase
      .from('profile_views')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', user.id)
      .then(({ count }: { count: number | null }) => setProfileViews(count ?? 0));
  }, [user?.id]);

  const highlightViews = useMemo(() => {
    return posts.filter((p) => p.userId === user?.id).reduce((sum, p) => sum + (p.likes ?? 0), 0);
  }, [posts, user?.id]);

  const renderPost = useCallback(
    ({ item }: { item: Post }) => (
      <PostCard
        post={item}
        currentUserId={user?.id}
        savedPosts={savedPosts}
        onUserPress={handleUserPress}
        onLike={(id) => {
          track(EVENTS.POST_LIKED, { postId: id });
          likePost(id);
        }}
        onComment={handleCommentsPress}
        onShare={handleSharePress}
        onMenu={openMenu}
        onSaveToggle={handleSaveToggle}
        onApply={handleApplyToOpportunity}
      />
    ),
    [
      user?.id,
      savedPosts,
      handleUserPress,
      handleCommentsPress,
      handleSharePress,
      handleApplyToOpportunity,
      handleSaveToggle,
      openMenu,
      likePost,
      track,
    ],
  );

  const ListHeader = () => (
    <View>
      <WhoIsWatchingSection
        interestedOrgs={interestedOrgs}
        isLoading={loadingOrgs}
        onUserPress={handleUserPress}
      />
      <AthleteStatsBar
        profileViews={profileViews}
        interestedCount={interestedOrgs.length}
        highlightViews={highlightViews}
      />
      <AthleteQuickActions />
      <AthleteFeedHeader />
    </View>
  );

  return (
    <BgGradient style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item, index) => item.id ?? `post-${index}`}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={ItemSeparator}
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
        {...FLATLIST_PERF_PROPS}
        ListFooterComponent={
          isLoadingMore || (isLoading && posts.length === 0) ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.emptyContainer}>
              <Trophy size={48} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>No highlights yet</Text>
              <Text style={styles.emptySubtext}>
                Follow athletes and coaches to see their posts
              </Text>
            </View>
          )
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
      {selectedPost && (
        <PostActionsMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          onEdit={() => {
            setMenuVisible(false);
            setEditVisible(true);
          }}
          onDelete={() => {
            setMenuVisible(false);
            setConfirmVisible(true);
          }}
        />
      )}
      {selectedPost && (
        <EditPostModal
          visible={editVisible}
          onClose={() => setEditVisible(false)}
          initialContent={selectedPost.content}
          onSave={async (newContent: string) => {
            setEditVisible(false);
            await updatePost(selectedPost.id, { content: newContent });
          }}
        />
      )}
      {selectedPost && (
        <ConfirmDialog
          visible={confirmVisible}
          title="Delete post?"
          message="This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          destructive
          onCancel={() => setConfirmVisible(false)}
          onConfirm={async () => {
            setConfirmVisible(false);
            await handleDeletePost(selectedPost.id);
            setSelectedPost(null);
          }}
        />
      )}
    </BgGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingVertical: theme.spacing.sm },
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
