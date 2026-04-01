import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import {
  ArrowLeft,
  Zap,
  MessageSquare,
  Send,
  Star,
  Trophy,
  Target,
  Award,
  Flame,
} from 'lucide-react-native';
import { theme } from '@/constants/theme';
import CachedImage from '@/components/CachedImage';
import { Post } from '@/types';
import { usePosts } from '@/hooks/posts-context';
import { useAuth } from '@/hooks/auth-context';
import CommentsModal from '@/components/CommentsModal';
import ShareModal from '@/components/ShareModal';
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

export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { posts, likePost } = usePosts();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);

  useEffect(() => {
    if (id && posts.length > 0) {
      const foundPost = posts.find((p) => p.id === id);
      setPost(foundPost || null);
      setIsLoading(false);
    }
  }, [id, posts]);

  const handleUserPress = (userId: string) => {
    if (userId === user?.id) {
      router.push({ pathname: '/(tabs)/profile' as any });
    } else {
      router.push({ pathname: '/user/[id]' as any, params: { id: userId } });
    }
  };

  const handleCommentsPress = () => {
    setCommentsModalVisible(true);
  };

  const handleSharePress = () => {
    setShareModalVisible(true);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Post',
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                <ArrowLeft size={24} color={theme.colors.text} />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading post...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Post',
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                <ArrowLeft size={24} color={theme.colors.text} />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Post not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Post',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <ArrowLeft size={24} color={theme.colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.postContainer}>
          <View style={styles.postHeader}>
            <TouchableOpacity style={styles.userInfo} onPress={() => handleUserPress(post.userId)}>
              <View style={styles.avatarContainer}>
                <CachedImage source={post.userAvatar} size={48} placeholder="avatar" />
                <View
                  style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(post.userRole) }]}
                >
                  {getRoleIcon(post.userRole)}
                </View>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{post.userName}</Text>
                <View style={styles.roleContainer}>
                  <Text style={[styles.userRole, { color: getRoleBadgeColor(post.userRole) }]}>
                    {post.userRole.toUpperCase()}
                  </Text>
                  <View style={styles.timestampDot} />
                  <Text style={styles.postTime}>
                    {new Date(post.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton}>
              <Star size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.postContent}>{post.content}</Text>

          {post.media && (
            <View style={styles.mediaContainer}>
              {post.media.type === 'image' ? (
                <CachedImage
                  source={post.media.url}
                  size={width - theme.spacing.md * 2}
                  placeholder="post"
                  borderRadius={theme.borderRadius.md}
                  style={{
                    width: width - theme.spacing.md * 2,
                    height: (width - theme.spacing.md * 2) * 0.75,
                  }}
                />
              ) : (
                <VideoPlayer
                  uri={post.media.url ?? ''}
                  poster={post.media.thumbnail}
                  height={width * 0.75}
                  width={width}
                  autoPlay={false}
                  loop={false}
                  muted={false}
                  testID={`post-video-${post.id}`}
                />
              )}
            </View>
          )}

          <View style={styles.postActions}>
            <TouchableOpacity
              style={[styles.actionButton, post.isLiked && styles.likedButton]}
              onPress={() => likePost(post.id)}
            >
              <Zap
                size={24}
                color={post.isLiked ? theme.colors.white : theme.colors.primary}
                fill={post.isLiked ? theme.colors.white : 'transparent'}
              />
              <Text style={[styles.actionText, post.isLiked && styles.likedText]}>
                {post.likes} Power
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleCommentsPress}>
              <MessageSquare size={22} color={theme.colors.textSecondary} />
              <Text style={styles.actionText}>{post.comments}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleSharePress}>
              <Send size={22} color={theme.colors.textSecondary} />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Comments Modal */}
      <CommentsModal
        visible={commentsModalVisible}
        onClose={() => setCommentsModalVisible(false)}
        postId={post.id}
        postAuthor={post.userName}
      />

      {/* Share Modal */}
      <ShareModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        post={post}
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
    paddingVertical: theme.spacing.md,
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
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  backButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  postContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
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
    borderWidth: 2,
    borderColor: theme.colors.border,
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
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userRole: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 0.5,
  },
  timestampDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.colors.textSecondary,
    marginHorizontal: theme.spacing.xs,
  },
  postTime: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  postContent: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
    fontWeight: theme.fontWeight.medium,
  },
  mediaContainer: {
    marginHorizontal: -theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  postImage: {
    width: width - theme.spacing.md * 2,
    height: (width - theme.spacing.md * 2) * 0.75,
    resizeMode: 'cover',
    borderRadius: theme.borderRadius.md,
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
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
  },
  likedButton: {
    backgroundColor: theme.colors.primary,
  },
  actionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  likedText: {
    color: theme.colors.white,
  },
});
