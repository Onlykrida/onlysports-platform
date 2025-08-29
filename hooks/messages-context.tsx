import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';
import { useAuth } from './auth-context';
import { useNotifications } from './notifications-context';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  postId?: string;
  read: boolean;
  createdAt: Date;
  senderName?: string;
  senderAvatar?: string;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  participantRole?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
}

interface MessagesState {
  conversations: Conversation[];
  messages: { [conversationId: string]: Message[] };
  isLoading: boolean;
  sendMessage: (receiverId: string, content: string, postId?: string) => Promise<{ error?: string }>;
  markAsRead: (conversationId: string) => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
}

export const [MessagesProvider, useMessages] = createContextHook<MessagesState>(() => {
  const { user } = useAuth();
  const { createNotification } = useNotifications();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<{ [conversationId: string]: Message[] }>({});
  const [isLoading, setIsLoading] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!user || !isSupabaseConfigured) return;

    try {
      setIsLoading(true);
      
      // Get all messages where user is sender or receiver
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          content,
          read,
          created_at,
          sender:profiles!messages_sender_id_fkey(name, avatar, role),
          receiver:profiles!messages_receiver_id_fkey(name, avatar, role)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading conversations:', error);
        return;
      }

      // Group messages by conversation (other participant)
      const conversationMap = new Map<string, Conversation>();
      
      messagesData?.forEach((msg: any) => {
        const isFromUser = msg.sender_id === user.id;
        const otherParticipantId = isFromUser ? msg.receiver_id : msg.sender_id;
        const otherParticipant = isFromUser ? msg.receiver : msg.sender;
        
        if (!conversationMap.has(otherParticipantId)) {
          conversationMap.set(otherParticipantId, {
            id: otherParticipantId,
            participantId: otherParticipantId,
            participantName: otherParticipant?.name || 'Unknown User',
            participantAvatar: otherParticipant?.avatar,
            participantRole: otherParticipant?.role,
            lastMessage: msg.content,
            lastMessageTime: new Date(msg.created_at),
            unreadCount: 0,
          });
        }
        
        // Count unread messages (messages sent to current user that are unread)
        if (!isFromUser && !msg.read) {
          const conv = conversationMap.get(otherParticipantId)!;
          conv.unreadCount += 1;
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loadMessages = useCallback(async (conversationId: string) => {
    if (!user || !isSupabaseConfigured) return;

    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          content,
          read,
          created_at,
          sender:profiles!messages_sender_id_fkey(name, avatar)
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${conversationId}),and(sender_id.eq.${conversationId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      const formattedMessages: Message[] = messagesData?.map((msg: any) => ({
        id: msg.id,
        senderId: msg.sender_id,
        receiverId: msg.receiver_id,
        content: msg.content,
        read: msg.read,
        createdAt: new Date(msg.created_at),
        senderName: msg.sender?.name,
        senderAvatar: msg.sender?.avatar,
      })) || [];

      setMessages(prev => ({
        ...prev,
        [conversationId]: formattedMessages,
      }));
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }, [user]);

  const sendMessage = useCallback(async (receiverId: string, content: string, postId?: string) => {
    if (!user || !isSupabaseConfigured) {
      return { error: 'Not authenticated or database not configured' };
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content,
          post_id: postId || null,
          read: false,
        });

      if (error) {
        console.error('Error sending message:', error);
        return { error: error.message };
      }

      // Create a real-time notification for the receiver
      await createNotification(receiverId, 'message', 'New message', content.substring(0, 80));

      // Refresh messages for this conversation
      await loadMessages(receiverId);
      await loadConversations();
      
      return {};
    } catch (error) {
      console.error('Failed to send message:', error);
      return { error: 'Failed to send message' };
    }
  }, [user, loadMessages, loadConversations, createNotification]);

  const markAsRead = useCallback(async (conversationId: string) => {
    if (!user || !isSupabaseConfigured) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', conversationId)
        .eq('receiver_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('Error marking messages as read:', error);
        return;
      }

      // Update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }, [user]);

  const refreshConversations = useCallback(async () => {
    await loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user, loadConversations]);

  // Real-time updates for messages and profile changes impacting conversations
  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;

    const channel = supabase
      .channel('messages_and_profiles_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
        const msg = payload.new as { id: string; sender_id: string; receiver_id: string; content: string; read: boolean; created_at: string };
        const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;

        setMessages(prev => {
          const prevList = prev[otherId] || [];
          const nextItem: Message = {
            id: msg.id,
            senderId: msg.sender_id,
            receiverId: msg.receiver_id,
            content: msg.content,
            read: msg.read,
            createdAt: new Date(msg.created_at),
          };
          return { ...prev, [otherId]: [...prevList, nextItem] };
        });

        loadConversations();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (_payload: any) => {
        // When any profile changes, refresh conversations to get latest names/avatars
        loadConversations();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, loadConversations]);

  return useMemo(() => ({
    conversations,
    messages,
    isLoading,
    sendMessage,
    markAsRead,
    loadMessages,
    refreshConversations,
  }), [conversations, messages, isLoading, sendMessage, markAsRead, loadMessages, refreshConversations]);
});