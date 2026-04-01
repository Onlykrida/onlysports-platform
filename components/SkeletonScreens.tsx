import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { SkeletonLoader } from './SkeletonLoader';
import { theme } from '../constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CONTENT_WIDTH = SCREEN_WIDTH - theme.spacing.md * 2;

// --- Post Skeleton (feed items) ---

export const PostSkeleton: React.FC = () => (
  <View style={styles.postContainer}>
    {/* Header: avatar + name/time */}
    <View style={styles.row}>
      <SkeletonLoader width={40} height={40} shape="circle" />
      <View style={styles.postHeaderText}>
        <SkeletonLoader width={120} height={14} shape="text" />
        <SkeletonLoader width={80} height={10} shape="text" style={{ marginTop: 6 }} />
      </View>
    </View>
    {/* Body text lines */}
    <SkeletonLoader width={CONTENT_WIDTH} height={12} shape="text" style={{ marginTop: 14 }} />
    <SkeletonLoader
      width={CONTENT_WIDTH * 0.75}
      height={12}
      shape="text"
      style={{ marginTop: 8 }}
    />
    {/* Media placeholder */}
    <SkeletonLoader width={CONTENT_WIDTH} height={200} shape="rect" style={{ marginTop: 14 }} />
    {/* Action bar */}
    <View style={[styles.row, { marginTop: 14 }]}>
      <SkeletonLoader width={60} height={12} shape="text" />
      <SkeletonLoader width={60} height={12} shape="text" style={{ marginLeft: 16 }} />
      <SkeletonLoader width={60} height={12} shape="text" style={{ marginLeft: 16 }} />
    </View>
  </View>
);

export const PostSkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <View>
    {Array.from({ length: count }).map((_, i) => (
      <PostSkeleton key={i} />
    ))}
  </View>
);

// --- Profile Skeleton ---

export const ProfileSkeleton: React.FC = () => (
  <View style={styles.profileContainer}>
    {/* Cover photo */}
    <SkeletonLoader width={SCREEN_WIDTH} height={180} shape="rect" borderRadius={0} />
    {/* Avatar overlapping cover */}
    <View style={styles.profileAvatarWrap}>
      <SkeletonLoader width={88} height={88} shape="circle" />
    </View>
    {/* Name and bio */}
    <View style={styles.profileInfo}>
      <SkeletonLoader width={160} height={18} shape="text" />
      <SkeletonLoader width={100} height={12} shape="text" style={{ marginTop: 8 }} />
      <SkeletonLoader width={CONTENT_WIDTH} height={12} shape="text" style={{ marginTop: 16 }} />
      <SkeletonLoader
        width={CONTENT_WIDTH * 0.6}
        height={12}
        shape="text"
        style={{ marginTop: 8 }}
      />
    </View>
    {/* Stats row */}
    <View style={[styles.row, styles.profileStats]}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.statItem}>
          <SkeletonLoader width={36} height={16} shape="text" />
          <SkeletonLoader width={52} height={10} shape="text" style={{ marginTop: 4 }} />
        </View>
      ))}
    </View>
  </View>
);

// --- Opportunity Skeleton (job/opportunity cards) ---

export const OpportunitySkeleton: React.FC = () => (
  <View style={styles.opportunityCard}>
    {/* Title */}
    <SkeletonLoader width={CONTENT_WIDTH * 0.7} height={16} shape="text" />
    {/* Subtitle / org */}
    <SkeletonLoader
      width={CONTENT_WIDTH * 0.45}
      height={12}
      shape="text"
      style={{ marginTop: 10 }}
    />
    {/* Description lines */}
    <SkeletonLoader width={CONTENT_WIDTH - 32} height={12} shape="text" style={{ marginTop: 16 }} />
    <SkeletonLoader
      width={(CONTENT_WIDTH - 32) * 0.8}
      height={12}
      shape="text"
      style={{ marginTop: 8 }}
    />
    {/* Tags row */}
    <View style={[styles.row, { marginTop: 16 }]}>
      <SkeletonLoader width={64} height={24} shape="rect" borderRadius={theme.borderRadius.full} />
      <SkeletonLoader
        width={80}
        height={24}
        shape="rect"
        borderRadius={theme.borderRadius.full}
        style={{ marginLeft: 8 }}
      />
      <SkeletonLoader
        width={56}
        height={24}
        shape="rect"
        borderRadius={theme.borderRadius.full}
        style={{ marginLeft: 8 }}
      />
    </View>
  </View>
);

export const OpportunitySkeletonList: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <View>
    {Array.from({ length: count }).map((_, i) => (
      <OpportunitySkeleton key={i} />
    ))}
  </View>
);

// --- Message Skeleton (conversation list items) ---

export const MessageSkeleton: React.FC = () => (
  <View style={styles.messageRow}>
    <SkeletonLoader width={50} height={50} shape="circle" />
    <View style={styles.messageText}>
      <SkeletonLoader width={140} height={14} shape="text" />
      <SkeletonLoader width={200} height={12} shape="text" style={{ marginTop: 8 }} />
    </View>
    <SkeletonLoader width={36} height={10} shape="text" />
  </View>
);

export const MessageSkeletonList: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <View>
    {Array.from({ length: count }).map((_, i) => (
      <MessageSkeleton key={i} />
    ))}
  </View>
);

// --- Chat Skeleton (message bubble placeholders) ---

export const ChatSkeleton: React.FC = () => (
  <View style={styles.chatContainer}>
    {/* Received message - left */}
    <View style={styles.chatBubbleRow}>
      <SkeletonLoader width={30} height={30} shape="circle" />
      <View style={styles.chatBubbleLeft}>
        <SkeletonLoader width={180} height={36} shape="rect" borderRadius={theme.borderRadius.lg} />
      </View>
    </View>
    {/* Sent message - right */}
    <View style={[styles.chatBubbleRow, styles.chatBubbleRowRight]}>
      <View style={styles.chatBubbleRight}>
        <SkeletonLoader width={140} height={36} shape="rect" borderRadius={theme.borderRadius.lg} />
      </View>
    </View>
    {/* Received message - left (longer) */}
    <View style={styles.chatBubbleRow}>
      <SkeletonLoader width={30} height={30} shape="circle" />
      <View style={styles.chatBubbleLeft}>
        <SkeletonLoader width={220} height={52} shape="rect" borderRadius={theme.borderRadius.lg} />
      </View>
    </View>
    {/* Sent message - right (short) */}
    <View style={[styles.chatBubbleRow, styles.chatBubbleRowRight]}>
      <View style={styles.chatBubbleRight}>
        <SkeletonLoader width={100} height={36} shape="rect" borderRadius={theme.borderRadius.lg} />
      </View>
    </View>
  </View>
);

// --- User Profile Skeleton (cover + avatar + stats + grid) ---

export const UserProfileSkeleton: React.FC = () => (
  <View style={styles.profileContainer}>
    {/* Cover photo */}
    <SkeletonLoader width={SCREEN_WIDTH} height={180} shape="rect" borderRadius={0} />
    {/* Avatar overlapping cover */}
    <View style={styles.profileAvatarWrap}>
      <SkeletonLoader width={88} height={88} shape="circle" />
    </View>
    {/* Name and role badge */}
    <View style={styles.profileInfo}>
      <SkeletonLoader width={160} height={18} shape="text" />
      <SkeletonLoader width={80} height={14} shape="text" style={{ marginTop: 8 }} />
    </View>
    {/* Stats row */}
    <View style={[styles.row, styles.profileStats]}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.statItem}>
          <SkeletonLoader width={36} height={16} shape="text" />
          <SkeletonLoader width={52} height={10} shape="text" style={{ marginTop: 4 }} />
        </View>
      ))}
    </View>
    {/* Action buttons */}
    <View
      style={[
        styles.row,
        { marginTop: theme.spacing.md, paddingHorizontal: theme.spacing.md, gap: theme.spacing.sm },
      ]}
    >
      <SkeletonLoader
        width={CONTENT_WIDTH * 0.45}
        height={40}
        shape="rect"
        borderRadius={theme.borderRadius.full}
      />
      <SkeletonLoader
        width={CONTENT_WIDTH * 0.45}
        height={40}
        shape="rect"
        borderRadius={theme.borderRadius.full}
      />
    </View>
    {/* Post grid (2x2) */}
    <View style={styles.userProfileGrid}>
      {[1, 2, 3, 4].map((i) => (
        <SkeletonLoader
          key={i}
          width={(SCREEN_WIDTH - theme.spacing.md * 2 - theme.spacing.sm) / 2}
          height={(SCREEN_WIDTH - theme.spacing.md * 2 - theme.spacing.sm) / 2}
          shape="rect"
          borderRadius={theme.borderRadius.md}
        />
      ))}
    </View>
  </View>
);

// --- Discover Skeleton (search bar + user cards) ---

export const DiscoverSkeleton: React.FC = () => (
  <View style={styles.discoverContainer}>
    {/* Search bar placeholder */}
    <SkeletonLoader
      width={CONTENT_WIDTH}
      height={44}
      shape="rect"
      borderRadius={theme.borderRadius.full}
      style={{ alignSelf: 'center' }}
    />
    {/* Filter row */}
    <View
      style={[
        styles.row,
        { marginTop: theme.spacing.md, gap: theme.spacing.sm, paddingHorizontal: theme.spacing.md },
      ]}
    >
      {[1, 2, 3, 4].map((i) => (
        <SkeletonLoader
          key={i}
          width={72}
          height={32}
          shape="rect"
          borderRadius={theme.borderRadius.full}
        />
      ))}
    </View>
    {/* User cards */}
    {[1, 2, 3, 4].map((i) => (
      <View key={i} style={styles.discoverCard}>
        <SkeletonLoader width={50} height={50} shape="circle" />
        <View style={styles.discoverCardText}>
          <SkeletonLoader width={140} height={14} shape="text" />
          <SkeletonLoader width={90} height={12} shape="text" style={{ marginTop: 6 }} />
          <SkeletonLoader width={110} height={10} shape="text" style={{ marginTop: 6 }} />
        </View>
        <SkeletonLoader
          width={80}
          height={32}
          shape="rect"
          borderRadius={theme.borderRadius.full}
        />
      </View>
    ))}
  </View>
);

// --- Feed Skeleton (post card skeletons) ---

export const FeedSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <View>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={styles.feedCard}>
        {/* Header: avatar + name/time */}
        <View style={styles.row}>
          <SkeletonLoader width={44} height={44} shape="circle" />
          <View style={styles.postHeaderText}>
            <SkeletonLoader width={130} height={14} shape="text" />
            <SkeletonLoader width={70} height={10} shape="text" style={{ marginTop: 6 }} />
          </View>
        </View>
        {/* Body text */}
        <SkeletonLoader width={CONTENT_WIDTH} height={12} shape="text" style={{ marginTop: 14 }} />
        <SkeletonLoader
          width={CONTENT_WIDTH * 0.65}
          height={12}
          shape="text"
          style={{ marginTop: 8 }}
        />
        {/* Media placeholder */}
        <SkeletonLoader width={CONTENT_WIDTH} height={220} shape="rect" style={{ marginTop: 14 }} />
        {/* Action bar */}
        <View style={[styles.row, { marginTop: 14, gap: theme.spacing.md }]}>
          <SkeletonLoader width={48} height={12} shape="text" />
          <SkeletonLoader width={48} height={12} shape="text" />
          <SkeletonLoader width={48} height={12} shape="text" />
        </View>
      </View>
    ))}
  </View>
);

// --- Styles ---

const styles = StyleSheet.create({
  // Post
  postContainer: {
    padding: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postHeaderText: {
    marginLeft: theme.spacing.sm,
  },

  // Profile
  profileContainer: {
    alignItems: 'center',
  },
  profileAvatarWrap: {
    marginTop: -44,
    borderWidth: 3,
    borderColor: theme.colors.background,
    borderRadius: 44,
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  profileStats: {
    justifyContent: 'space-around',
    width: '100%',
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
  },
  statItem: {
    alignItems: 'center',
  },

  // Opportunity
  opportunityCard: {
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },

  // Message
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  messageText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },

  // Chat
  chatContainer: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.md,
  },
  chatBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  chatBubbleRowRight: {
    justifyContent: 'flex-end',
  },
  chatBubbleLeft: {
    alignItems: 'flex-start',
  },
  chatBubbleRight: {
    alignItems: 'flex-end',
  },

  // User Profile
  userProfileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },

  // Discover
  discoverContainer: {
    paddingTop: theme.spacing.md,
  },
  discoverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  discoverCardText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },

  // Feed
  feedCard: {
    padding: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
});
