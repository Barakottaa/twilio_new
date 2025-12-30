import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { theme } from '../theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';
import type { Conversation } from '../types';

interface ChatListScreenProps {
  navigation: any;
}

export const ChatListScreen = ({ navigation }: ChatListScreenProps) => {
  const {
    conversations,
    isLoading,
    loadConversations,
    setSelectedConversation,
    selectedNumberId,
    setSelectedNumber,
    numbers,
    loadNumbers,
  } = useChatStore();
  const { agent } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showNumberSelector, setShowNumberSelector] = useState(false);

  useEffect(() => {
    loadNumbers();
  }, []);

  useEffect(() => {
    if (selectedNumberId) {
      loadConversations(selectedNumberId);
    }
  }, [selectedNumberId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations(selectedNumberId || undefined);
    setRefreshing(false);
  };

  // Filter conversations by selected number
  const filteredConversations = useMemo(() => {
    if (!selectedNumberId) return conversations;
    return conversations.filter((conv) => conv.twilioNumberId === selectedNumberId);
  }, [conversations, selectedNumberId]);

  const selectedNumber = numbers.find((n) => n.id === selectedNumberId);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation.id);
    navigation.navigate('ChatView', { conversationId: conversation.id });
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const lastMessage = item.messages?.[item.messages.length - 1];
    const lastMessageTime = lastMessage
      ? format(new Date(lastMessage.timestamp), 'HH:mm')
      : format(new Date(item.updatedAt), 'HH:mm');

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => handleSelectConversation(item)}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.customer.name.substring(0, 2).toUpperCase()}
            </Text>
          </View>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.customerName} numberOfLines={1}>
              {item.customer.name}
            </Text>
            <Text style={styles.timestamp}>{lastMessageTime}</Text>
          </View>

          <View style={styles.conversationFooter}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {lastMessage?.text || 'No messages yet'}
            </Text>
            {item.status === 'open' && (
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading && conversations.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Conversations</Text>
        <View style={styles.headerActions}>
          {numbers.length > 0 && (
            <TouchableOpacity
              style={styles.numberSelectorButton}
              onPress={() => setShowNumberSelector(true)}
            >
              <Icon name="phone" size={20} color={theme.colors.foreground} />
              <Text style={styles.numberSelectorText} numberOfLines={1}>
                {selectedNumber?.name || 'Select Number'}
              </Text>
              <Icon name="chevron-down" size={20} color={theme.colors.foreground} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Icon name="cog" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredConversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="message-outline" size={64} color={theme.colors.mutedForeground} />
            <Text style={styles.emptyText}>
              {selectedNumberId ? 'No conversations for this number' : 'Select a number to view conversations'}
            </Text>
          </View>
        }
      />

      {/* Number Selector Modal */}
      <Modal
        visible={showNumberSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNumberSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Phone Number</Text>
              <TouchableOpacity onPress={() => setShowNumberSelector(false)}>
                <Icon name="close" size={24} color={theme.colors.foreground} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {numbers.map((number) => (
                <TouchableOpacity
                  key={number.id}
                  style={[
                    styles.numberOption,
                    selectedNumberId === number.id && styles.numberOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedNumber(number.id);
                    setShowNumberSelector(false);
                  }}
                >
                  <View style={styles.numberOptionContent}>
                    <Text style={styles.numberOptionName}>{number.name}</Text>
                    <Text style={styles.numberOptionNumber}>{number.number}</Text>
                    {number.department && (
                      <Text style={styles.numberOptionDepartment}>{number.department}</Text>
                    )}
                  </View>
                  {selectedNumberId === number.id && (
                    <Icon name="check-circle" size={24} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.foreground,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  numberSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxWidth: 150,
  },
  numberSelectorText: {
    ...theme.typography.bodySmall,
    color: theme.colors.foreground,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    ...theme.typography.h3,
    color: theme.colors.foreground,
  },
  numberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  numberOptionSelected: {
    backgroundColor: theme.colors.primary + '10',
  },
  numberOptionContent: {
    flex: 1,
  },
  numberOptionName: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  numberOptionNumber: {
    ...theme.typography.bodySmall,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.xs,
  },
  numberOptionDepartment: {
    ...theme.typography.caption,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...theme.typography.bodySmall,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.md,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...theme.typography.bodySmall,
    color: theme.colors.primaryForeground,
    fontWeight: '600',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadText: {
    ...theme.typography.caption,
    color: theme.colors.primaryForeground,
    fontWeight: '600',
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  customerName: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.foreground,
    flex: 1,
  },
  timestamp: {
    ...theme.typography.caption,
    color: theme.colors.mutedForeground,
  },
  conversationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    ...theme.typography.bodySmall,
    color: theme.colors.mutedForeground,
    flex: 1,
  },
  statusBadge: {
    marginLeft: theme.spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.md,
  },
});

