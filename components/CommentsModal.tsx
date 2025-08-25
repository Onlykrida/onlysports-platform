import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { X, Send, Heart } from 'lucide-react-native';
import { theme } from '@/constants/theme';
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

export default function CommentsModal({ visible, onClose, postId, postAuthor }: CommentsModalProps) {
  const { user } = useAuth();
  const { refreshPosts } = usePosts();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        .select(`
          id,
          content,
          likes_count,
          created_at,
          user_id,
          profiles!comments_user_id_fkey (
            name,
            avatar
          )
        `)
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
        userAvatar: comment.profiles?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
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
  }, [visible, postId, loadCommentsCallback]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user || !postId || !isSupabaseConfigured) return;

    setIsSubmitting(true);
    try {
      // Insert comment into database
      const { error } = await supabase
        .from('comments')
        .insert({
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

  const handleLikeComment = async (commentId: string) => {
    if (!user || !isSupabaseConfigured) return;

    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

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
          return;
        }
      } else {
        // Like comment
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            user_id: user.id,
            comment_id: commentId,
          });

        if (error) {
          console.error('Error liking comment:', error);
          return;
        }
      }

      // Update local state optimistically
      setComments(prev => prev.map(c => 
        c.id === commentId 
          ? { 
              ...c, 
              isLiked: !c.isLiked,
              likes: c.isLiked ? c.likes - 1 : c.likes + 1
            }
          : c
      ));
    } catch (error) {
      console.error('Failed to toggle comment like:', error);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <Image source={{ uri: item.userAvatar }} style={styles.commentAvatar} />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentUserName}>{item.userName}</Text>
          <Text style={styles.commentTime}>{formatTimeAgo(item.createdAt)}</Text>
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
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading comments...</Text>
          </View>
        ) : (
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.commentsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No comments yet</Text>
                <Text style={styles.emptyStateSubtext}>Be the first to comment!</Text>
              </View>
            }
          />
        )}

        <View style={styles.inputContainer}>
          <Image 
            source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100' }} 
            style={styles.inputAvatar} 
          />
          <TextInput
            style={styles.textInput}
            placeholder={`Comment as ${user?.name || 'User'}...`}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!newComment.trim() || isSubmitting) && styles.sendButtonDisabled]}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  commentsList: {
    padding: theme.spacing.md,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
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
    marginBottom: theme.spacing.xs,
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
    paddingVertical: theme.spacing.xl,
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
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.white,
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