import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { X, Send, Heart, Trash2, MessageCircle } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { FLATLIST_PERF_PROPS } from '@/constants/performance';
import CachedImage from '@/components/CachedImage';
import { useAuth } from '@/hooks/auth-context';
import { usePosts } from '@/hooks/posts-context';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  likes: number;
  isLiked: boolean;
  createdAt: Date;
}

interface CommentsModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
  postAuthor: string;
}

// Skeleton placeholder for loading state
function CommentSkeleton() {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.commentItem}>
      <Animated.View style={[styles.skeletonAvatar, { opacity: pulseAnim }]} />
      <View style={styles.commentContent}>
        <Animated.View style={[styles.skeletonNameLine, { opacity: pulseAnim }]} />
        <Animated.View style={[styles.skeletonTextLine, { opacity: pulseAnim }]} />
        <Animated.View style={[styles.skeletonTextLineShort, { opacity: pulseAnim }]} />
      </View>
    </View>
  );
}

export default function CommentsModal({
  visible,
  onClose,
  postId,
  postAuthor,
}: CommentsModalProps) {
  const { user } = useAuth();
  const { refreshPosts } = usePosts();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const loadComments = async () => {
    if (!postId || !isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Load comments from database
      const { data: commentsData, error } = await supabase
        .from('comments')
        .select(
          `
          id,
          content,
          likes_count,
          created_at,
          user_id,
          profiles!comments_user_id_fkey (
            name,
            avatar
          )
        `,
        )
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading comments:', error);
        setComments([]);
        return;
      }

      // Check which comments the current user has liked
      let userLikes: string[] = [];
      if (user) {
        const { data: likesData } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', user.id)
          .in('comment_id', commentsData?.map((c: any) => c.id) || []);

        userLikes = likesData?.map((like: any) => like.comment_id) || [];
      }

      const formattedComments: Comment[] = (commentsData || []).map((comment: any) => ({
        id: comment.id,
        userId: comment.user_id,
        userName: comment.profiles?.name || 'Unknown User',
        userAvatar: comment.profiles?.avatar || '',
        content: comment.content,
        likes: comment.likes_count || 0,
        isLiked: userLikes.includes(comment.id),
        createdAt: new Date(comment.created_at),
      }));

      setComments(formattedComments);
    } catch (error) {
      console.error('Failed to load comments:', error);
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCommentsCallback = useCallback(loadComments, [postId, user]);

  useEffect(() => {
    if (visible && postId) {
      loadCommentsCallback();
    }
    if (!visible) {
      // Reset state when modal closes
      setDeletingIds(new Set());
    }
  }, [visible, postId, loadCommentsCallback]);

  // Real-time subscription for new comments on this post
  useEffect(() => {
    if (!visible || !postId || !isSupabaseConfigured) return;

    const channel = supabase
      .channel(`comments_${postId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` },
        (payload: any) => {
          if (__DEV__) console.log('New comment received via realtime:', payload);
          // Only reload if the comment was not created by the current user
          // (we already handle local state for our own comments)
          if (payload.new?.user_id !== user?.id) {
            loadCommentsCallback();
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` },
        (payload: any) => {
          if (__DEV__) console.log('Comment deleted via realtime:', payload);
          // Remove the deleted comment from local state
          if (payload.old?.id) {
            setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
          }
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [visible, postId, user?.id, loadCommentsCallback]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user || !postId || !isSupabaseConfigured) return;

    setIsSubmitting(true);
    try {
      // Insert comment into database
      const { error } = await supabase.from('comments').insert({
        post_id: postId,
        user_id: user.id,
        content: newComment.trim(),
      });

      if (error) {
        console.error('Error creating comment:', error);
        Alert.alert('Error', 'Failed to post comment');
        return;
      }

      // Clear input and reload comments
      setNewComment('');
      await loadCommentsCallback();

      // Refresh posts to update comment count
      await refreshPosts();
    } catch (error) {
      console.error('Failed to submit comment:', error);
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user || !isSupabaseConfigured) return;

    Alert.alert('Delete Comment', 'Are you sure you want to delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeletingIds((prev) => new Set(prev).add(commentId));
          try {
            const { error } = await supabase
              .from('comments')
              .delete()
              .eq('id', commentId)
              .eq('user_id', user.id);

            if (error) {
              console.error('Error deleting comment:', error);
              Alert.alert('Error', 'Failed to delete comment');
              return;
            }

            // Remove from local state
            setComments((prev) => prev.filter((c) => c.id !== commentId));

            // Refresh posts to update comment count
            await refreshPosts();
          } catch (error) {
            console.error('Failed to delete comment:', error);
            Alert.alert('Error', 'Failed to delete comment');
          } finally {
            setDeletingIds((prev) => {
              const next = new Set(prev);
              next.delete(commentId);
              return next;
            });
          }
        },
      },
    ]);
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user || !isSupabaseConfigured) return;

    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;

    // Optimistic update first
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              isLiked: !c.isLiked,
              likes: c.isLiked ? c.likes - 1 : c.likes + 1,
            }
          : c,
      ),
    );

    try {
      if (comment.isLiked) {
        // Unlike comment
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('comment_id', commentId);

        if (error) {
          console.error('Error unliking comment:', error);
          // Revert optimistic update
          setComments((prev) =>
            prev.map((c) =>
              c.id === commentId ? { ...c, isLiked: comment.isLiked, likes: comment.likes } : c,
            ),
          );
          return;
        }
      } else {
        // Like comment
        const { error } = await supabase.from('comment_likes').insert({
          user_id: user.id,
          comment_id: commentId,
        });

        if (error) {
          console.error('Error liking comment:', error);
          // Revert optimistic update
          setComments((prev) =>
            prev.map((c) =>
              c.id === commentId ? { ...c, isLiked: comment.isLiked, likes: comment.likes } : c,
            ),
          );
          return;
        }
      }
    } catch (error) {
      console.error('Failed to toggle comment like:', error);
      // Revert optimistic update
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, isLiked: comment.isLiked, likes: comment.likes } : c,
        ),
      );
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;

    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}mo ago`;
  };

  const isOwnComment = (comment: Comment) => user?.id === comment.userId;

  const renderComment = useCallback(
    ({ item }: { item: Comment }) => {
      const isDeleting = deletingIds.has(item.id);

      return (
        <View style={[styles.commentItem, isDeleting && styles.commentItemDeleting]}>
          <CachedImage source={item.userAvatar} size={32} placeholder="avatar" />
          <View style={styles.commentContent}>
            <View style={styles.commentHeader}>
              <View style={styles.commentHeaderLeft}>
                <Text style={styles.commentUserName}>{item.userName}</Text>
                <Text style={styles.commentTime}>{formatTimeAgo(item.createdAt)}</Text>
              </View>
              {isOwnComment(item) && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteComment(item.id)}
                  disabled={isDeleting}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color={theme.colors.textSecondary} />
                  ) : (
                    <Trash2 size={14} color={theme.colors.textSecondary} />
                  )}
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.commentText}>{item.content}</Text>
            <TouchableOpacity
              style={styles.commentLikeButton}
              onPress={() => handleLikeComment(item.id)}
            >
              <Heart
                size={14}
                color={item.isLiked ? theme.colors.danger : theme.colors.textSecondary}
                fill={item.isLiked ? theme.colors.danger : 'transparent'}
              />
              {item.likes > 0 && (
                <Text style={[styles.commentLikes, item.isLiked && styles.commentLikesActive]}>
                  {item.likes}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [deletingIds, handleDeleteComment, handleLikeComment, user?.id],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Comments</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.skeletonContainer}>
            <CommentSkeleton />
            <CommentSkeleton />
            <CommentSkeleton />
            <CommentSkeleton />
          </View>
        ) : (
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.commentsList,
              comments.length === 0 && styles.commentsListEmpty,
            ]}
            showsVerticalScrollIndicator={false}
            {...FLATLIST_PERF_PROPS}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MessageCircle size={48} color={theme.colors.textMuted} />
                <Text style={styles.emptyStateText}>No comments yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Be the first to comment on {postAuthor ? `${postAuthor}'s` : 'this'} post!
                </Text>
              </View>
            }
          />
        )}

        <View style={styles.inputContainer}>
          <CachedImage source={user?.avatar} size={32} placeholder="avatar" />
          <TextInput
            style={styles.textInput}
            placeholder={`Comment as ${user?.name || 'User'}...`}
            placeholderTextColor={theme.colors.textMuted}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newComment.trim() || isSubmitting) && styles.sendButtonDisabled,
            ]}
            onPress={handleSubmitComment}
            disabled={!newComment.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={theme.colors.white} />
            ) : (
              <Send size={20} color={theme.colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  // Skeleton loading styles
  skeletonContainer: {
    flex: 1,
    padding: theme.spacing.md,
  },
  skeletonAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceLight,
    marginRight: theme.spacing.sm,
  },
  skeletonNameLine: {
    width: 100,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.surfaceLight,
    marginBottom: theme.spacing.sm,
  },
  skeletonTextLine: {
    width: '90%',
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.surfaceLight,
    marginBottom: theme.spacing.xs,
  },
  skeletonTextLineShort: {
    width: '60%',
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.surfaceLight,
  },
  commentsList: {
    padding: theme.spacing.md,
  },
  commentsListEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  commentItemDeleting: {
    opacity: 0.5,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: theme.spacing.sm,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  commentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  commentUserName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },
  commentTime: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  deleteButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  commentText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
  commentLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: theme.spacing.xs,
  },
  commentLikes: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  commentLikesActive: {
    color: theme.colors.danger,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyStateText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.semibold,
    marginTop: theme.spacing.md,
  },
  emptyStateSubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: theme.spacing.sm,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    backgroundColor: theme.colors.surfaceLight,
    maxHeight: 100,
    marginRight: theme.spacing.sm,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.textSecondary,
  },
});
