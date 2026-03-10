import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';
import { useAuth } from './auth-context';
import { useNotifications } from './notifications-context';

export interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  content: string;
  mediaUrl?: string;
  createdAt: Date;
  senderName?: string;
  senderAvatar?: string;
}

export interface Group {
  id: string;
  name: string;
  avatar?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  memberCount: number;
  lastMessage?: string;
  lastMessageTime?: Date;
  lastMessageSender?: string;
  unreadCount: number;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: 'admin' | 'member';
  joinedAt: Date;
  userName?: string;
  userAvatar?: string;
}

interface GroupsState {
  groups: Group[];
  groupMessages: { [groupId: string]: GroupMessage[] };
  isLoading: boolean;
  createGroup: (name: string, avatar: string | null, memberIds: string[]) => Promise<{ groupId?: string; error?: string }>;
  sendGroupMessage: (groupId: string, content: string, mediaUrl?: string) => Promise<{ error?: string }>;
  loadGroupMessages: (groupId: string) => Promise<void>;
  addMember: (groupId: string, userId: string) => Promise<{ error?: string }>;
  removeMember: (groupId: string, userId: string) => Promise<{ error?: string }>;
  leaveGroup: (groupId: string) => Promise<{ error?: string }>;
  getGroupMembers: (groupId: string) => Promise<GroupMember[]>;
  refreshGroups: () => Promise<void>;
}

export const [GroupsProvider, useGroups] = createContextHook<GroupsState>(() => {
  const { user } = useAuth();
  const { createNotification } = useNotifications();
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupMessages, setGroupMessages] = useState<{ [groupId: string]: GroupMessage[] }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Load all groups the user belongs to with last message preview
  const loadGroups = useCallback(async () => {
    if (!user || !isSupabaseConfigured) return;

    try {
      setIsLoading(true);

      // Get groups user is a member of
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (memberError) {
        console.error('Error loading group memberships:', memberError);
        return;
      }

      if (!memberData || memberData.length === 0) {
        setGroups([]);
        return;
      }

      const groupIds = memberData.map((m: any) => m.group_id);

      // Get group details
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('id, name, avatar, created_by, created_at, updated_at')
        .in('id', groupIds);

      if (groupsError) {
        console.error('Error loading groups:', groupsError);
        return;
      }

      // For each group, get member count and last message
      const groupList: Group[] = await Promise.all(
        (groupsData || []).map(async (g: any) => {
          // Member count
          const { data: members } = await supabase
            .from('group_members')
            .select('id')
            .eq('group_id', g.id);

          // Last message
          const { data: lastMsgData } = await supabase
            .from('group_messages')
            .select('content, created_at, sender_id, sender:profiles!group_messages_sender_id_fkey(name)')
            .eq('group_id', g.id)
            .order('created_at', { ascending: false })
            .limit(1);

          const lastMsg = lastMsgData?.[0];

          // Simple unread heuristic: if the last message was not sent by the current user, mark as 1 unread
          const hasUnread = lastMsg && lastMsg.sender_id !== user.id;

          return {
            id: g.id,
            name: g.name,
            avatar: g.avatar,
            createdBy: g.created_by,
            createdAt: new Date(g.created_at),
            updatedAt: new Date(g.updated_at),
            memberCount: members?.length || 0,
            lastMessage: lastMsg?.content,
            lastMessageTime: lastMsg ? new Date(lastMsg.created_at) : undefined,
            lastMessageSender: (lastMsg?.sender as any)?.name,
            unreadCount: hasUnread ? 1 : 0,
          };
        })
      );

      // Sort by last message time (most recent first)
      groupList.sort((a, b) => {
        const timeA = a.lastMessageTime?.getTime() || a.createdAt.getTime();
        const timeB = b.lastMessageTime?.getTime() || b.createdAt.getTime();
        return timeB - timeA;
      });

      setGroups(groupList);
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loadGroupMessages = useCallback(async (groupId: string) => {
    if (!user || !isSupabaseConfigured) return;

    try {
      const { data: messagesData, error } = await supabase
        .from('group_messages')
        .select(`
          id,
          group_id,
          sender_id,
          content,
          media_url,
          created_at,
          sender:profiles!group_messages_sender_id_fkey(name, avatar)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading group messages:', error);
        return;
      }

      const formatted: GroupMessage[] = (messagesData || []).map((msg: any) => ({
        id: msg.id,
        groupId: msg.group_id,
        senderId: msg.sender_id,
        content: msg.content,
        mediaUrl: msg.media_url,
        createdAt: new Date(msg.created_at),
        senderName: msg.sender?.name,
        senderAvatar: msg.sender?.avatar,
      }));

      setGroupMessages(prev => ({
        ...prev,
        [groupId]: formatted,
      }));
    } catch (error) {
      console.error('Failed to load group messages:', error);
    }
  }, [user]);

  const sendGroupMessage = useCallback(async (groupId: string, content: string, mediaUrl?: string) => {
    if (!user || !isSupabaseConfigured) {
      return { error: 'Not authenticated or database not configured' };
    }

    try {
      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          sender_id: user.id,
          content,
          media_url: mediaUrl || null,
        });

      if (error) {
        console.error('Error sending group message:', error);
        return { error: error.message };
      }

      // Refresh messages for this group
      await loadGroupMessages(groupId);
      await loadGroups();

      return {};
    } catch (error) {
      console.error('Failed to send group message:', error);
      return { error: 'Failed to send message' };
    }
  }, [user, loadGroupMessages, loadGroups]);

  const createGroup = useCallback(async (name: string, avatar: string | null, memberIds: string[]) => {
    if (!user || !isSupabaseConfigured) {
      return { error: 'Not authenticated or database not configured' };
    }

    try {
      // Create the group
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert({
          name,
          avatar: avatar || null,
          created_by: user.id,
        })
        .select('id')
        .single();

      if (groupError) {
        console.error('Error creating group:', groupError);
        return { error: groupError.message };
      }

      const groupId = groupData.id;

      // Add creator as admin
      const membersToInsert = [
        { group_id: groupId, user_id: user.id, role: 'admin' },
        ...memberIds.map(id => ({ group_id: groupId, user_id: id, role: 'member' })),
      ];

      const { error: membersError } = await supabase
        .from('group_members')
        .insert(membersToInsert);

      if (membersError) {
        console.error('Error adding group members:', membersError);
        return { error: membersError.message };
      }

      // Notify members
      if (createNotification) {
        for (const memberId of memberIds) {
          try {
            await createNotification(
              memberId,
              'message',
              'Added to Group',
              `${user.name} added you to "${name}"`,
              { groupId, groupName: name }
            );
          } catch (e) {
            console.error('Failed to send group notification:', e);
          }
        }
      }

      await loadGroups();
      return { groupId };
    } catch (error) {
      console.error('Failed to create group:', error);
      return { error: 'Failed to create group' };
    }
  }, [user, createNotification, loadGroups]);

  const addMember = useCallback(async (groupId: string, userId: string) => {
    if (!user || !isSupabaseConfigured) {
      return { error: 'Not authenticated or database not configured' };
    }

    try {
      const { error } = await supabase
        .from('group_members')
        .insert({ group_id: groupId, user_id: userId, role: 'member' });

      if (error) {
        console.error('Error adding member:', error);
        return { error: error.message };
      }

      await loadGroups();
      return {};
    } catch (error) {
      console.error('Failed to add member:', error);
      return { error: 'Failed to add member' };
    }
  }, [user, loadGroups]);

  const removeMember = useCallback(async (groupId: string, userId: string) => {
    if (!user || !isSupabaseConfigured) {
      return { error: 'Not authenticated or database not configured' };
    }

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing member:', error);
        return { error: error.message };
      }

      await loadGroups();
      return {};
    } catch (error) {
      console.error('Failed to remove member:', error);
      return { error: 'Failed to remove member' };
    }
  }, [user, loadGroups]);

  const leaveGroup = useCallback(async (groupId: string) => {
    if (!user || !isSupabaseConfigured) {
      return { error: 'Not authenticated or database not configured' };
    }

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error leaving group:', error);
        return { error: error.message };
      }

      // Remove from local state
      setGroups(prev => prev.filter(g => g.id !== groupId));
      setGroupMessages(prev => {
        const next = { ...prev };
        delete next[groupId];
        return next;
      });

      return {};
    } catch (error) {
      console.error('Failed to leave group:', error);
      return { error: 'Failed to leave group' };
    }
  }, [user]);

  const getGroupMembers = useCallback(async (groupId: string): Promise<GroupMember[]> => {
    if (!user || !isSupabaseConfigured) return [];

    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          id,
          group_id,
          user_id,
          role,
          joined_at,
          user:profiles!group_members_user_id_fkey(name, avatar)
        `)
        .eq('group_id', groupId);

      if (error) {
        console.error('Error loading group members:', error);
        return [];
      }

      return (data || []).map((m: any) => ({
        id: m.id,
        groupId: m.group_id,
        userId: m.user_id,
        role: m.role,
        joinedAt: new Date(m.joined_at),
        userName: m.user?.name,
        userAvatar: m.user?.avatar,
      }));
    } catch (error) {
      console.error('Failed to load group members:', error);
      return [];
    }
  }, [user]);

  const refreshGroups = useCallback(async () => {
    await loadGroups();
  }, [loadGroups]);

  // Initial load
  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user, loadGroups]);

  // Real-time subscription for group messages
  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;

    const channel = supabase
      .channel('group_messages_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages' }, (payload: any) => {
        const msg = payload.new as {
          id: string;
          group_id: string;
          sender_id: string;
          content: string;
          media_url?: string;
          created_at: string;
        };

        // Check if user is in this group (from local state)
        const isInGroup = groups.some(g => g.id === msg.group_id);
        if (!isInGroup) return;

        // Add message to local state
        setGroupMessages(prev => {
          const prevList = prev[msg.group_id] || [];
          // Avoid duplicates
          if (prevList.some(m => m.id === msg.id)) return prev;
          const nextItem: GroupMessage = {
            id: msg.id,
            groupId: msg.group_id,
            senderId: msg.sender_id,
            content: msg.content,
            mediaUrl: msg.media_url,
            createdAt: new Date(msg.created_at),
          };
          return { ...prev, [msg.group_id]: [...prevList, nextItem] };
        });

        // Refresh groups to update last message preview
        loadGroups();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, groups, loadGroups]);

  return useMemo(() => ({
    groups,
    groupMessages,
    isLoading,
    createGroup,
    sendGroupMessage,
    loadGroupMessages,
    addMember,
    removeMember,
    leaveGroup,
    getGroupMembers,
    refreshGroups,
  }), [groups, groupMessages, isLoading, createGroup, sendGroupMessage, loadGroupMessages, addMember, removeMember, leaveGroup, getGroupMembers, refreshGroups]);
});
