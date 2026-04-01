import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Zap, MessageSquare } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import CachedImage from '@/components/CachedImage';
import type { Post } from '@/types';

const { width } = Dimensions.get('window');

const getRelativeTime = (date: Date): string => {
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

interface MiniPostCardProps {
  post: Post;
  onUserPress: (userId: string) => void;
  onLike: (postId: string) => void;
}

const MiniPostCard: React.FC<MiniPostCardProps> = ({ post, onUserPress, onLike }) => (
  <View style={styles.miniPostCard}>
    <TouchableOpacity style={styles.miniPostHeader} onPress={() => onUserPress(post.userId)}>
      <CachedImage source={post.userAvatar} size={28} placeholder="avatar" />
      <View style={{ flex: 1 }}>
        <Text style={styles.miniPostUser} numberOfLines={1}>
          {post.userName}
        </Text>
        <Text style={styles.miniPostTime} numberOfLines={1} ellipsizeMode="tail">
          {getRelativeTime(post.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>

    <Text style={styles.miniPostContent} numberOfLines={3}>
      {post.content}
    </Text>

    {post.media?.type === 'image' && (
      <CachedImage
        source={post.media.url}
        size={width - theme.spacing.md * 2 - theme.spacing.sm * 2}
        placeholder="post"
        style={{ height: 120, borderRadius: theme.borderRadius.sm }}
      />
    )}

    <View style={styles.miniPostActions}>
      <TouchableOpacity style={styles.miniAction} onPress={() => onLike(post.id)}>
        <Zap
          size={14}
          color={post.isLiked ? theme.colors.primary : theme.colors.textMuted}
          fill={post.isLiked ? theme.colors.primary : 'transparent'}
        />
        <Text style={[styles.miniActionText, post.isLiked && { color: theme.colors.primary }]}>
          {post.likes}
        </Text>
      </TouchableOpacity>
      <View style={styles.miniAction}>
        <MessageSquare size={14} color={theme.colors.textMuted} />
        <Text style={styles.miniActionText}>{post.comments}</Text>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  miniPostCard: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.sm,
    ...theme.dashBorder,
  },
  miniPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  miniPostUser: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  miniPostTime: {
    fontSize: 9,
    color: theme.colors.textMuted,
  },
  miniPostContent: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    lineHeight: 18,
    marginBottom: theme.spacing.sm,
  },
  miniPostActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  miniAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniActionText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: theme.fontWeight.bold,
  },
});

export default React.memo(MiniPostCard);
