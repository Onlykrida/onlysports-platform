import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { theme } from '@/constants/theme';
import { useMessages, Message } from '@/hooks/messages-context';
import { useAuth } from '@/hooks/auth-context';

export default function ChatScreen() {
  const { id, name, avatar, role } = useLocalSearchParams<{
    id: string;
    name: string;
    avatar: string;
    role: string;
  }>();
  
  const { messages, sendMessage, markAsRead, loadMessages } = useMessages();
  const { user } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  
  const conversationMessages = messages[id] || [];

  useEffect(() => {
    if (id) {
      loadMessages(id);
      markAsRead(id);
    }
  }, [id, loadMessages, markAsRead]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || isSending) return;

    const text = messageText.trim();
    setMessageText('');
    setIsSending(true);

    try {
      const result = await sendMessage(id, text);
      if (result.error) {
        Alert.alert('Error', result.error);
        setMessageText(text); // Restore message on error
      } else {
        // Scroll to bottom after sending
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message');
      setMessageText(text);
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isFromCurrentUser = item.senderId === user?.id;
    
    return (
      <View
        style={[
          styles.messageContainer,
          isFromCurrentUser ? styles.sentMessage : styles.receivedMessage,
        ]}
      >
        {!isFromCurrentUser && (
          <Image
            source={{ 
              uri: item.senderAvatar || 'https://via.placeholder.com/30x30/E5E7EB/9CA3AF?text=U'
            }}
            style={styles.messageAvatar}
          />
        )}
        
        <View
          style={[
            styles.messageBubble,
            isFromCurrentUser ? styles.sentBubble : styles.receivedBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isFromCurrentUser ? styles.sentText : styles.receivedText,
            ]}
          >
            {item.content}
          </Text>
          
          <Text
            style={[
              styles.messageTime,
              isFromCurrentUser ? styles.sentTime : styles.receivedTime,
            ]}
          >
            {formatMessageTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Image
            source={{ 
              uri: avatar || 'https://via.placeholder.com/40x40/E5E7EB/9CA3AF?text=U'
            }}
            style={styles.headerAvatar}
          />
          <View>
            <Text style={styles.headerName}>{name}</Text>
            <Text style={styles.headerRole}>{role}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={conversationMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
          onLayout={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
        />

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Type a message..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
            placeholderTextColor={theme.colors.textSecondary}
            editable={!isSending}
          />
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!messageText.trim() || isSending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || isSending}
          >
            <Send 
              size={20} 
              color={
                !messageText.trim() || isSending 
                  ? theme.colors.textSecondary 
                  : theme.colors.white
              } 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 0,
    gap: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  headerRole: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    textTransform: 'capitalize',
    fontWeight: theme.fontWeight.medium,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    alignItems: 'flex-end',
  },
  sentMessage: {
    justifyContent: 'flex-end',
  },
  receivedMessage: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: theme.spacing.sm,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },
  sentBubble: {
    backgroundColor: theme.colors.primary,
    marginLeft: 'auto',
    borderRadius: 20,
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: '#4A90E2',
    borderRadius: 20,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: theme.fontSize.md,
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
  sentText: {
    color: theme.colors.white,
  },
  receivedText: {
    color: theme.colors.white,
  },
  messageTime: {
    fontSize: theme.fontSize.xs,
  },
  sentTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  receivedTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderTopWidth: 0,
    gap: theme.spacing.sm,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 24,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: '#000000',
    backgroundColor: theme.colors.white,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#2C2C2E',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
});