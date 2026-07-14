import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MessageCircle, Users, Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import { theme } from '@/constants/theme';
import { formatDate } from '@/constants/format-date';
import { FLATLIST_PERF_PROPS } from '@/constants/performance';
import { useMessages, Conversation } from '@/hooks/messages-context';
import { useGroups, Group } from '@/hooks/group-messages-context';
import { useAuth } from '@/hooks/auth-context';
import { MessageSkeletonList } from '@/components/SkeletonScreens';
import { BackgroundGradient } from '@/components/BackgroundGradient';
import CachedImage from '@/components/CachedImage';

type TabType = 'dms' | 'groups';

export default function MessagesScreen() {
  const { conversations, isLoading: isLoadingDMs, refreshConversations } = useMessages();
  const { groups, isLoading: isLoadingGroups, refreshGroups } = useGroups();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('dms');

  const filteredConversations = conversations.filter((conv) =>
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleConversationPress = useCallback((conversation: Conversation) => {
    router.push({
      pathname: '/chat/[id]' as any,
      params: {
        id: conversation.participantId,
        name: conversation.participantName,
        avatar: conversation.participantAvatar || '',
        role: conversation.participantRole || '',
      },
    });
  }, []);

  const handleGroupPress = useCallback((group: Group) => {
    router.push({
      pathname: '/chat/group/[id]' as any,
      params: {
        id: group.id,
        name: group.name,
      },
    });
  }, []);

  const handleCreateGroup = useCallback(() => {
    router.push('/chat/create-group' as any);
  }, []);

  const handleRefresh = async () => {
    if (activeTab === 'dms') {
      await refreshConversations();
    } else {
      await refreshGroups();
    }
  };

  const formatTime = useCallback((date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return formatDate(date);
  }, []);

  const renderConversation = useCallback(
    ({ item }: { item: Conversation }) => (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => handleConversationPress(item)}
        testID={`conversation-${item.id}`}
      >
        <View style={styles.avatarContainer}>
          <CachedImage source={item.participantAvatar} size={50} placeholder="avatar" />
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.participantName} numberOfLines={1} ellipsizeMode="tail">
              {item.participantName}
            </Text>
            <Text style={styles.participantRole} numberOfLines={1} ellipsizeMode="tail">
              {item.participantRole}
            </Text>
            {item.lastMessageTime && (
              <Text style={styles.timestamp} numberOfLines={1} ellipsizeMode="tail">
                {formatTime(item.lastMessageTime)}
              </Text>
            )}
          </View>

          {item.lastMessage && (
            <Text
              style={[styles.lastMessage, item.unreadCount > 0 && styles.unreadMessage]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.lastMessage}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    ),
    [handleConversationPress, formatTime],
  );

  const renderGroup = useCallback(
    ({ item }: { item: Group }) => (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => handleGroupPress(item)}
        testID={`group-${item.id}`}
      >
        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <CachedImage source={item.avatar} size={50} placeholder="avatar" />
          ) : (
            <View style={[styles.avatar, styles.groupAvatarPlaceholder]}>
              <Users size={24} color={theme.colors.primary} />
            </View>
          )}
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.participantName} numberOfLines={1} ellipsizeMode="tail">
              {item.name}
            </Text>
            <Text style={styles.memberCount} numberOfLines={1} ellipsizeMode="tail">
              {item.memberCount} members
            </Text>
            {item.lastMessageTime && (
              <Text style={styles.timestamp} numberOfLines={1} ellipsizeMode="tail">
                {formatTime(item.lastMessageTime)}
              </Text>
            )}
          </View>

          {item.lastMessage && (
            <Text style={styles.lastMessage} numberOfLines={1} ellipsizeMode="tail">
              {item.lastMessageSender ? `${item.lastMessageSender}: ` : ''}
              {item.lastMessage}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    ),
    [handleGroupPress, formatTime],
  );

  const isLoading = activeTab === 'dms' ? isLoadingDMs : isLoadingGroups;
  const showSkeleton = isLoadingDMs && conversations.length === 0 && activeTab === 'dms';

  if (showSkeleton) {
    return (
      <BackgroundGradient>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Chats</Text>
            <TouchableOpacity style={styles.createGroupButton} onPress={handleCreateGroup}>
              <Plus size={22} color="#000" />
            </TouchableOpacity>
          </View>
          <MessageSkeletonList />
        </SafeAreaView>
      </BackgroundGradient>
    );
  }

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chats</Text>
          <TouchableOpacity style={styles.createGroupButton} onPress={handleCreateGroup}>
            <Plus size={22} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'dms' ? styles.activeTab : styles.inactiveTab]}
            onPress={() => setActiveTab('dms')}
          >
            <MessageCircle size={16} color={activeTab === 'dms' ? '#000' : '#888'} />
            <Text
              style={[styles.tabText, activeTab === 'dms' && styles.activeTabText]}
              numberOfLines={1}
            >
              DMs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'groups' ? styles.activeTab : styles.inactiveTab]}
            onPress={() => setActiveTab('groups')}
          >
            <Users size={16} color={activeTab === 'groups' ? '#000' : '#888'} />
            <Text
              style={[styles.tabText, activeTab === 'groups' && styles.activeTabText]}
              numberOfLines={1}
            >
              Groups
            </Text>
            {groups.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{groups.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#888" />
            <TextInput
              style={styles.searchInput}
              placeholder={activeTab === 'dms' ? 'Search conversations...' : 'Search groups...'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#666"
            />
          </View>
        </View>

        {activeTab === 'dms' ? (
          filteredConversations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MessageCircle size={64} color="#888" />
              <Text style={styles.emptyTitle}>NO CONVERSATIONS YET</Text>
              <Text style={styles.emptySubtitle}>
                Start a conversation by messaging someone from their profile
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredConversations}
              renderItem={renderConversation}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={isLoadingDMs}
                  onRefresh={handleRefresh}
                  tintColor={theme.colors.primary}
                />
              }
              showsVerticalScrollIndicator={false}
              {...FLATLIST_PERF_PROPS}
            />
          )
        ) : filteredGroups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Users size={64} color="#888" />
            <Text style={styles.emptyTitle}>NO GROUPS YET</Text>
            <Text style={styles.emptySubtitle}>
              Create a group to start chatting with multiple people
            </Text>
            <TouchableOpacity style={styles.emptyCreateButton} onPress={handleCreateGroup}>
              <Plus size={18} color="#000" />
              <Text style={styles.emptyCreateButtonText}>Create Group</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredGroups}
            renderItem={renderGroup}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isLoadingGroups}
                onRefresh={handleRefresh}
                tintColor={theme.colors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
            {...FLATLIST_PERF_PROPS}
          />
        )}
      </SafeAreaView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '900' as const,
    color: theme.colors.text,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  createGroupButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#30D158',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#30D158',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: theme.spacing.xs,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#30D158',
  },
  inactiveTab: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderStyle: 'dashed' as const,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  tabText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700' as const,
    color: '#888',
  },
  activeTabText: {
    color: '#000',
    fontWeight: '900' as const,
  },
  tabBadge: {
    backgroundColor: theme.colors.orange,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '800' as const,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  listContent: {
    paddingVertical: theme.spacing.sm,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed' as const,
    borderColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 12,
    marginBottom: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
    flexShrink: 0,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#30D158',
  },
  groupAvatarPlaceholder: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1.5,
    borderStyle: 'dashed' as const,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF9F0A',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '800' as const,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  participantName: {
    fontSize: theme.fontSize.md,
    fontWeight: '900' as const,
    color: '#f0f0f0',
    letterSpacing: 0.5,
    flex: 1,
  },
  participantRole: {
    fontSize: 10,
    color: '#FF9F0A',
    fontWeight: '800' as const,
    letterSpacing: 1,
    textTransform: 'uppercase',
    flexShrink: 0,
  },
  memberCount: {
    fontSize: 10,
    color: '#FF9F0A',
    fontWeight: '800' as const,
    letterSpacing: 1,
    textTransform: 'uppercase',
    flexShrink: 0,
  },
  timestamp: {
    fontSize: theme.fontSize.xs,
    color: '#888',
    marginLeft: 'auto',
    flexShrink: 0,
  },
  lastMessage: {
    fontSize: theme.fontSize.sm,
    color: '#666',
  },
  unreadMessage: {
    color: '#f0f0f0',
    fontWeight: '700' as const,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '900' as const,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
    maxWidth: '100%',
  },
  emptySubtitle: {
    fontSize: theme.fontSize.md,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '100%',
  },
  emptyCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#30D158',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
    shadowColor: '#30D158',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyCreateButtonText: {
    color: '#000',
    fontSize: theme.fontSize.md,
    fontWeight: '900' as const,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
