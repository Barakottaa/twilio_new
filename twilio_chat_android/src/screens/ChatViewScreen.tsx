import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { theme } from '../theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';
import type { Message } from '../types';
import { MessageBubble } from '../components/MessageBubble';

interface ChatViewScreenProps {
  route: any;
  navigation: any;
}

export const ChatViewScreen = ({ route, navigation }: ChatViewScreenProps) => {
  const { conversationId } = route.params;
  const { messages, sendMessage, loadMessages, selectedConversationId } = useChatStore();
  const { agent } = useAuthStore();
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const conversationMessages = messages[conversationId] || [];
  const conversation = useChatStore((state) =>
    state.conversations.find((c) => c.id === conversationId)
  );

  useEffect(() => {
    loadMessages(conversationId);
  }, [conversationId]);

  useEffect(() => {
    if (conversationMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [conversationMessages.length]);

  const handleSend = async () => {
    if (!messageText.trim() || sending) return;

    const text = messageText.trim();
    setMessageText('');
    setSending(true);

    try {
      await sendMessage(conversationId, text);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore message text on error
      setMessageText(text);
    } finally {
      setSending(false);
    }
  };

  // Memoize renderMessage to improve performance
  const renderMessage = React.useCallback(({ item }: { item: Message }) => {
    const isAgent = item.sender === 'agent';
    const showAvatar = true; // Show avatar for customer messages

    return (
      <MessageBubble
        message={item}
        isAgent={isAgent}
        showAvatar={showAvatar}
        contactName={conversation?.customer.name}
        agentName={agent?.name}
      />
    );
  }, [conversation?.customer.name, agent?.name]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={theme.colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {conversation?.customer.name || 'Chat'}
          </Text>
          {conversation?.customer.phoneNumber && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {conversation.customer.phoneNumber}
            </Text>
          )}
        </View>
        <TouchableOpacity>
          <Icon name="dots-vertical" size={24} color={theme.colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={conversationMessages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="message-outline" size={48} color={theme.colors.mutedForeground} />
            <Text style={styles.emptyText}>No messages yet</Text>
          </View>
        }
      />

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={theme.colors.mutedForeground}
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!messageText.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!messageText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={theme.colors.primaryForeground} />
          ) : (
            <Icon name="send" size={20} color={theme.colors.primaryForeground} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  headerTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  headerSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.mutedForeground,
    marginTop: 2,
  },
  messagesContainer: {
    padding: theme.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    ...theme.typography.bodySmall,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  input: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.foreground,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    maxHeight: 100,
    marginRight: theme.spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

