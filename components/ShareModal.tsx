import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { X, Send, Search } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import CachedImage from '@/components/CachedImage';
import { FLATLIST_PERF_PROPS } from '@/constants/performance';
import { useAuth } from '@/hooks/auth-context';
import { useMessages, Conversation } from '@/hooks/messages-context';
import { Post } from '@/types';

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  post: Post;
}

export default function ShareModal({ visible, onClose, post }: ShareModalProps) {
  const { user } = useAuth();
  const { conversations, sendMessage } = useMessages();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = conversations.filter((conv) =>
        conv.participantName.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredConversations(filtered);
    } else {
      setFilteredConversations(conversations);
    }
  }, [searchQuery, conversations]);

  const handleShare = async (conversation: Conversation) => {
    if (!user || !post) return;

    setIsSharing(true);
    try {
      const contentPreview = post.content.substring(0, 100);
      const ellipsis = post.content.length > 100 ? '...' : '';

      // Create a shareable link to the post
      const postLink = `https://onlykrida.app/post/${post.id}`;

      const shareMessage = `🏆 Check out this post from ${post.userName}:\n\n"${contentPreview}${ellipsis}"\n\n🔗 View full post: ${postLink}\n\n#OnlyKrida #${post.userRole}`;

      const result = await sendMessage(conversation.participantId, shareMessage, post.id);

      if (result.error) {
        Alert.alert('Error', result.error);
      } else {
        Alert.alert('Success', `Post shared with ${conversation.participantName}!`);
        onClose();
      }
    } catch (error) {
      if (__DEV__) console.error('Failed to share post:', error);
      Alert.alert('Error', 'Failed to share post');
    } finally {
      setIsSharing(false);
    }
  };

  const renderConversation = useCallback(
    ({ item }: { item: Conversation }) => (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => handleShare(item)}
        disabled={isSharing}
      >
        <CachedImage source={item.participantAvatar} size={48} placeholder="avatar" />
        <View style={styles.conversationInfo}>
          <Text style={styles.participantName}>{item.participantName}</Text>
          <Text style={styles.participantRole}>{item.participantRole?.toUpperCase()}</Text>
        </View>
        {isSharing ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <Send size={20} color={theme.colors.primary} />
        )}
      </TouchableOpacity>
    ),
    [isSharing, handleShare],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Share Post</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Post Preview */}
        <View style={styles.postPreview}>
          <View style={styles.postHeader}>
            <CachedImage source={post.userAvatar} size={32} placeholder="avatar" />
            <View>
              <Text style={styles.postUserName}>{post.userName}</Text>
              <Text style={styles.postUserRole}>{post.userRole.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.postContent} numberOfLines={3}>
            {post.content}
          </Text>
          {post.media && (
            <CachedImage
              source={post.media.url}
              size={120}
              placeholder="post"
              borderRadius={theme.borderRadius.md}
              style={{ width: '100%', height: 120 }}
            />
          )}
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Search size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations…"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Conversations List */}
        <FlatList
          data={filteredConversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.conversationsList}
          showsVerticalScrollIndicator={false}
          {...FLATLIST_PERF_PROPS}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery
                  ? 'Try a different search term'
                  : 'Start a conversation to share posts'}
              </Text>
            </View>
          }
        />
      </View>
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
  postPreview: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  postAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: theme.spacing.sm,
  },
  postUserName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  postUserRole: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
  },
  postContent: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  postImage: {
    width: '100%',
    height: 120,
    borderRadius: theme.borderRadius.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  conversationsList: {
    paddingHorizontal: theme.spacing.md,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: theme.spacing.md,
  },
  conversationInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  participantRole: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    marginTop: 2,
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
    textAlign: 'center',
  },
});
