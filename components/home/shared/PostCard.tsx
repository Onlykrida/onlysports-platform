import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
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
import CachedImage from '@/components/CachedImage';
import VideoPlayer from '@/components/VideoPlayer';
import { theme } from '@/constants/theme';
import { Post } from '@/types';

const { width } = Dimensions.get('window');

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  savedPosts: Set<string>;
  onUserPress: (userId: string) => void;
  onLike: (postId: string) => void;
  onComment: (post: Post) => void;
  onShare: (post: Post) => void;
  onMenu: (post: Post) => void;
  onSaveToggle: (postId: string) => void;
  onApply?: (opportunityId: string) => void;
}

export const getRelativeTime = (date: Date): string => {
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

export const getRoleBadgeColor = (role: string): string => {
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

export const getRoleIcon = (role: string): React.ReactNode => {
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

const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  savedPosts,
  onUserPress,
  onLike,
  onComment,
  onShare,
  onMenu,
  onSaveToggle,
  onApply,
}) => {
  const isSaved = savedPosts.has(post.id);

  return (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <TouchableOpacity style={styles.userInfo} onPress={() => onUserPress(post.userId)}>
          <View style={styles.avatarContainer}>
            <CachedImage source={post.userAvatar} size={40} placeholder="avatar" />
            <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(post.userRole) }]}>
              {getRoleIcon(post.userRole)}
            </View>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
              {post.userName}
            </Text>
            <View style={styles.roleContainer}>
              <Text
                style={[styles.userRole, { color: getRoleBadgeColor(post.userRole) }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {post.userRole.toUpperCase()}
              </Text>
              <View style={styles.timestampDot} />
              <Text style={styles.postTime} numberOfLines={1} ellipsizeMode="tail">
                {getRelativeTime(post.createdAt)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          {currentUserId === post.userId && (
            <TouchableOpacity onPress={() => onMenu(post)} style={styles.menuButton}>
              <MoreVertical size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.saveButton} onPress={() => onSaveToggle(post.id)}>
            <Star
              size={20}
              color={isSaved ? theme.colors.warning : theme.colors.textSecondary}
              fill={isSaved ? theme.colors.warning : 'transparent'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {post.isOpportunity && post.opportunityData ? (
        <View style={styles.opportunityBanner}>
          <View style={styles.opportunityHeader}>
            <View style={[styles.opportunityBadge, { backgroundColor: theme.colors.accent }]}>
              <Text style={styles.opportunityBadgeText} numberOfLines={1}>
                OPPORTUNITY
              </Text>
            </View>
            <Text style={styles.opportunityType} numberOfLines={1} ellipsizeMode="tail">
              {post.opportunityData.type.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.postContent} numberOfLines={4} ellipsizeMode="tail">
            {post.content}
          </Text>
          <View style={styles.opportunityDetails}>
            <View style={styles.opportunityDetailRow}>
              <Target size={14} color={theme.colors.primary} />
              <Text style={styles.opportunityDetailText} numberOfLines={1} ellipsizeMode="tail">
                {post.opportunityData.sport}
              </Text>
            </View>
            <View style={styles.opportunityDetailRow}>
              <Zap size={14} color={theme.colors.warning} />
              <Text style={styles.opportunityDetailText} numberOfLines={1} ellipsizeMode="tail">
                {post.opportunityData.location}
              </Text>
            </View>
          </View>
          <View style={styles.opportunityFooter}>
            <Text style={styles.opportunityDeadline}>
              Deadline: {new Date(post.opportunityData.deadline).toLocaleDateString()}
            </Text>
            {!post.opportunityData.hasApplied ? (
              <TouchableOpacity style={styles.applyButton} onPress={() => onApply?.(post.id)}>
                <Text style={styles.applyButtonText}>Apply Now</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.appliedBadge}>
                <Text style={styles.appliedBadgeText}>Applied</Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        <Text style={styles.postContent} numberOfLines={4} ellipsizeMode="tail">
          {post.content}
        </Text>
      )}

      {post.media && (
        <View style={styles.mediaContainer}>
          {post.media.type === 'image' ? (
            <CachedImage
              source={post.media.url}
              size={width - theme.spacing.md * 2}
              placeholder="post"
              style={{
                height: (width - theme.spacing.md * 2) * 0.56,
                borderRadius: theme.borderRadius.md,
              }}
            />
          ) : (
            <VideoPlayer
              uri={post.media.url ?? ''}
              poster={post.media.thumbnail}
              height={width * 0.56}
              width={width}
              autoPlay={false}
              loop={false}
              muted={false}
            />
          )}
        </View>
      )}

      {!post.isOpportunity && (
        <View style={styles.postActions}>
          <TouchableOpacity
            style={[styles.actionButton, post.isLiked && styles.likedButton]}
            onPress={() => onLike(post.id)}
          >
            <Zap
              size={18}
              color={post.isLiked ? theme.colors.primary : theme.colors.textMuted}
              fill={post.isLiked ? theme.colors.primary : 'transparent'}
            />
            <Text style={[styles.actionText, post.isLiked && styles.likedText]}>
              {post.likes} Power
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => onComment(post)}>
            <MessageSquare size={18} color={theme.colors.textSecondary} />
            <Text style={styles.actionText}>{post.comments}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => onShare(post)}>
            <Send size={18} color={theme.colors.textSecondary} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  postContainer: {
    backgroundColor: theme.colors.cardBg,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.sm,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.cardBorder,
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
    flexShrink: 0,
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
    backgroundColor: theme.colors.cardBg,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    marginBottom: 1,
    letterSpacing: 1,
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
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
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
  likedButton: {
    backgroundColor: 'transparent',
  },
  actionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    fontWeight: theme.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  likedText: {
    color: theme.colors.primary,
  },

  // Opportunity styles
  opportunityBanner: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,159,10,0.3)',
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
    textTransform: 'uppercase',
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
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default React.memo(PostCard);
