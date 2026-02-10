import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import BgGradient from '@/components/BackgroundGradient';
import { 
  Zap, 
  MessageSquare, 
  Send, 
  Star, 
  MoreVertical,
  Trophy,
  Target,
  Award,
  Flame
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useOpportunities } from '@/hooks/opportunities-context';
import { theme } from '@/constants/theme';
import { Post } from '@/types';
import { useScouting } from '@/hooks/scouting-context';
import { usePosts } from '@/hooks/posts-context';
import { useAuth } from '@/hooks/auth-context';
import CommentsModal from '@/components/CommentsModal';
import ShareModal from '@/components/ShareModal';
import PostActionsMenu from '@/components/PostActionsMenu';
import EditPostModal from '@/components/EditPostModal';
import ConfirmDialog from '@/components/ConfirmDialog';

import VideoPlayer from '@/components/VideoPlayer';

const { width } = Dimensions.get('window');

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

export default function HomeScreen() {
  const { posts, isLoading, refreshPosts, likePost, deletePost, updatePost } = usePosts();
  const { topRecommendations } = useScouting();
  const { user } = useAuth();
  const { applyToOpportunity } = useOpportunities();
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  
  console.log('HomeScreen render - posts:', posts.length, 'isLoading:', isLoading, 'user:', user?.name);

  const handleDeletePost = useCallback(async (postId: string) => {
    const result = await deletePost(postId);
    if (result.error) {
      console.error('Failed to delete post:', result.error);
    }
  }, [deletePost]);

  const handleUserPress = (userId: string) => {
    if (userId === user?.id) {
      router.push('/(tabs)/profile' as any);
    } else {
      router.push({ pathname: '/user/[id]' as any, params: { id: userId } });
    }
  };

  const handleCommentsPress = (post: Post) => {
    setSelectedPost(post);
    setCommentsModalVisible(true);
  };

  const handleSharePress = (post: Post) => {
    setSelectedPost(post);
    setShareModalVisible(true);
  };

  const openMenu = useCallback((post: Post) => {
    setSelectedPost(post);
    setMenuVisible(true);
  }, []);

  const handleSaveToggle = useCallback((postId: string) => {
    setSavedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
        console.log('Post unsaved:', postId);
      } else {
        newSet.add(postId);
        console.log('Post saved:', postId);
      }
      return newSet;
    });
  }, []);

  const renderBadge = (role: string, fit?: number) => {
    if (role.toLowerCase() !== 'athlete' || typeof fit !== 'number') return null;
    const label = fit >= 90 ? 'Top Prospect' : fit >= 80 ? 'High Potential' : fit >= 70 ? "Scout's Pick" : null;
    if (!label) return null;
    return (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{label}</Text>
      </View>
    );
  };

  const handleApplyToOpportunity = useCallback(async (opportunityId: string) => {
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
    
    if (error) {
      alert(`Error: ${error}`);
    } else {
      alert('Application submitted successfully!');
      await refreshPosts();
    }
  }, [user, applyToOpportunity, refreshPosts]);

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postContainer} testID={`post-${item.id}`}>
      <View style={styles.postHeader}>
        <TouchableOpacity style={styles.userInfo} onPress={() => handleUserPress(item.userId)}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: item.userAvatar }} style={styles.avatar} />
            <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(item.userRole) }]}>
              {getRoleIcon(item.userRole)}
            </View>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.userName}</Text>
            <View style={styles.roleContainer}>
              <Text style={[styles.userRole, { color: getRoleBadgeColor(item.userRole) }]}>
                {item.userRole.toUpperCase()}
              </Text>
              <View style={styles.timestampDot} />
              <Text style={styles.postTime}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        {renderBadge(item.userRole, topRecommendations[user?.id ?? '']?.find(r => r.player_id === item.userId)?.fit_score)}
        <View style={styles.headerActions}>
          {user?.id === item.userId && (
            <TouchableOpacity 
              onPress={() => openMenu(item)}
              style={styles.menuButton}
              testID={`post-menu-${item.id}`}
            >
              <MoreVertical size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={() => handleSaveToggle(item.id)}
            testID={`save-button-${item.id}`}
          >
            <Star 
              size={20} 
              color={savedPosts.has(item.id) ? theme.colors.warning : theme.colors.textSecondary}
              fill={savedPosts.has(item.id) ? theme.colors.warning : 'transparent'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {item.isOpportunity && item.opportunityData ? (
        <View style={styles.opportunityBanner}>
          <View style={styles.opportunityHeader}>
            <View style={[styles.opportunityBadge, { backgroundColor: theme.colors.accent }]}>
              <Text style={styles.opportunityBadgeText}>OPPORTUNITY</Text>
            </View>
            <Text style={styles.opportunityType}>{item.opportunityData.type.toUpperCase()}</Text>
          </View>
          <Text style={styles.postContent}>{item.content}</Text>
          <View style={styles.opportunityDetails}>
            <View style={styles.opportunityDetailRow}>
              <Target size={14} color={theme.colors.primary} />
              <Text style={styles.opportunityDetailText}>{item.opportunityData.sport}</Text>
            </View>
            <View style={styles.opportunityDetailRow}>
              <Zap size={14} color={theme.colors.warning} />
              <Text style={styles.opportunityDetailText}>{item.opportunityData.location}</Text>
            </View>
            <View style={styles.opportunityDetailRow}>
              <Star size={14} color={item.opportunityData.paid ? theme.colors.success : theme.colors.textSecondary} />
              <Text style={styles.opportunityDetailText}>{item.opportunityData.paid ? 'Paid' : 'Unpaid'}</Text>
            </View>
          </View>
          <View style={styles.opportunityFooter}>
            <Text style={styles.opportunityDeadline}>
              Deadline: {new Date(item.opportunityData.deadline).toLocaleDateString()}
            </Text>
            {user?.role === 'athlete' && !item.opportunityData.hasApplied && (
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={() => handleApplyToOpportunity(item.id)}
              >
                <Text style={styles.applyButtonText}>Apply Now</Text>
              </TouchableOpacity>
            )}
            {item.opportunityData.hasApplied && (
              <View style={styles.appliedBadge}>
                <Text style={styles.appliedBadgeText}>Applied</Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        <Text style={styles.postContent}>{item.content}</Text>
      )}

      {item.media && (
        <View style={styles.mediaContainer}>
          {item.media.type === 'image' ? (
            <Image source={{ uri: item.media.url }} style={styles.postImage} />
          ) : (
            <VideoPlayer
              uri={item.media.url ?? ''}
              poster={item.media.thumbnail}
              height={width * 0.75}
              width={width}
              autoPlay={false}
              loop={false}
              muted={false}
              testID={`post-video-${item.id}`}
            />
          )}
        </View>
      )}

      {!item.isOpportunity && <View style={styles.postActions}>
        <TouchableOpacity 
          style={[styles.actionButton, item.isLiked && styles.likedButton]}
          onPress={() => likePost(item.id)}
        >
          <Zap 
            size={24} 
            color={item.isLiked ? theme.colors.white : theme.colors.primary}
            fill={item.isLiked ? theme.colors.white : 'transparent'}
          />
          <Text style={[styles.actionText, item.isLiked && styles.likedText]}>
            {item.likes} Power
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => handleCommentsPress(item)}>
          <MessageSquare size={22} color={theme.colors.textSecondary} />
          <Text style={styles.actionText}>{item.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => handleSharePress(item)}>
          <Send size={22} color={theme.colors.textSecondary} />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>}
    </View>
  );

  if (isLoading && posts.length === 0) {
    return (
      <BgGradient style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading the action...</Text>
        </View>
      </BgGradient>
    );
  }

  if (!isLoading && posts.length === 0) {
    return (
      <BgGradient style={styles.container}>
        <View style={styles.loadingContainer}>
          <Trophy size={48} color={theme.colors.textSecondary} />
          <Text style={styles.emptyText}>No highlights yet</Text>
          <Text style={styles.emptySubtext}>Be the first to share your sports moment!</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={refreshPosts}
          >
            <Text style={styles.refreshButtonText}>Refresh Feed</Text>
          </TouchableOpacity>
        </View>
      </BgGradient>
    );
  }

  return (
    <BgGradient style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshPosts}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
      
      {/* Comments Modal */}
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
      
      {/* Share Modal */}
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

      {/* Post Actions Menu */}
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

      {/* Edit Post Modal */}
      {selectedPost && (
        <EditPostModal
          visible={editVisible}
          onClose={() => setEditVisible(false)}
          initialContent={selectedPost.content}
          onSave={async (newContent: string) => {
            setEditVisible(false);
            const res = await updatePost(selectedPost.id, { content: newContent });
            if (res.error) {
              console.error('Failed to update post:', res.error);
            }
          }}
        />
      )}

      {/* Confirm Delete */}
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
  container: {
    flex: 1,
  },
  listContent: {
    paddingVertical: theme.spacing.sm,
  },
  postContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.electric,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  menuButton: {
    padding: theme.spacing.xs,
  },
  saveButton: {
    padding: theme.spacing.xs,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: theme.spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: theme.colors.primary,
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
    borderColor: theme.colors.surface,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    marginBottom: 2,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userRole: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 1,
  },
  timestampDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.colors.textMuted,
    marginHorizontal: theme.spacing.xs,
  },
  postTime: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  postContent: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textSecondary,
    lineHeight: 26,
    marginBottom: theme.spacing.lg,
    fontWeight: theme.fontWeight.regular,
  },
  mediaContainer: {
    marginHorizontal: -theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  postImage: {
    width: width - (theme.spacing.md * 2),
    height: (width - (theme.spacing.md * 2)) * 0.75,
    resizeMode: 'cover',
    borderRadius: theme.borderRadius.md,
  },
  videoPlaceholder: {
    position: 'relative',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 24,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  likedButton: {
    backgroundColor: theme.colors.primary, // Electric Blue for liked state
    borderColor: theme.colors.primary,
    ...theme.shadow.electric, // Electric blue glow
  },
  actionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    fontWeight: theme.fontWeight.bold,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  likedText: {
    color: theme.colors.white, // White text on electric blue
  },
  badge: {
    backgroundColor: theme.colors.accent, // Crimson Red for badges
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
    ...theme.shadow.fire, // Crimson red glow
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.black,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  separator: {
    height: theme.spacing.lg,
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
    fontWeight: theme.fontWeight.bold,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  emptyText: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  emptySubtext: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
    lineHeight: 22,
  },
  refreshButton: {
    backgroundColor: theme.colors.primary, // Electric Blue for primary actions
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl, // More rounded for sporty feel
    ...theme.shadow.electric, // Electric blue glow
  },
  refreshButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.extrabold,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  opportunityBanner: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  opportunityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  opportunityBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  opportunityBadgeText: {
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.white,
    letterSpacing: 0.5,
  },
  opportunityType: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  opportunityDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  opportunityDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  opportunityDetailText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  opportunityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  opportunityDeadline: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  applyButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  applyButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  appliedBadge: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  appliedBadgeText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
});