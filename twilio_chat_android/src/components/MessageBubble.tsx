import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { format } from 'date-fns';
import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  isAgent: boolean;
  showAvatar: boolean;
  contactName?: string;
  agentName?: string;
}

const MessageBubbleComponent = ({
  message,
  isAgent,
  showAvatar,
  contactName,
  agentName,
}: MessageBubbleProps) => {
  // Safely parse timestamp - handle invalid dates
  const parseTimestamp = (timestamp: string | undefined): string => {
    if (!timestamp) return '--:--';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        // Try parsing as ISO string or other formats
        const parsed = Date.parse(timestamp);
        if (isNaN(parsed)) {
          return '--:--';
        }
        return format(new Date(parsed), 'HH:mm');
      }
      return format(date, 'HH:mm');
    } catch (error) {
      console.error('Error parsing timestamp:', timestamp, error);
      return '--:--';
    }
  };

  const formattedTime = parseTimestamp(message.timestamp);

  const getInitials = () => {
    if (isAgent) {
      if (agentName && agentName.length >= 2) {
        return agentName.substring(0, 2).toUpperCase();
      }
      return 'AG';
    }
    if (contactName) {
      const words = contactName.trim().split(' ');
      if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
      }
      return contactName.substring(0, 2).toUpperCase();
    }
    return 'C';
  };

  return (
    <View
      style={[
        styles.container,
        isAgent ? styles.agentContainer : styles.customerContainer,
      ]}
    >
      {!isAgent && showAvatar && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials()}</Text>
        </View>
      )}
      {!isAgent && !showAvatar && <View style={styles.avatarPlaceholder} />}

      <View
        style={[
          styles.bubble,
          isAgent ? styles.agentBubble : styles.customerBubble,
        ]}
      >
        {message.media && message.media.length > 0 && (
          <View style={styles.mediaContainer}>
            <Text style={styles.mediaText}>📎 Media</Text>
          </View>
        )}

        {message.text && (
          <Text
            style={[
              styles.text,
              isAgent ? styles.agentText : styles.customerText,
            ]}
          >
            {message.text}
          </Text>
        )}

        <View style={styles.footer}>
          <Text
            style={[
              styles.timestamp,
              isAgent ? styles.agentTimestamp : styles.customerTimestamp,
            ]}
          >
            {formattedTime}
          </Text>
          {isAgent && message.deliveryStatus && (
            <View style={styles.statusContainer}>
              {message.deliveryStatus === 'sent' && (
                <Text style={styles.statusIcon}>✓</Text>
              )}
              {message.deliveryStatus === 'delivered' && (
                <Text style={styles.statusIcon}>✓✓</Text>
              )}
              {message.deliveryStatus === 'read' && (
                <Text style={[styles.statusIcon, styles.statusRead]}>✓✓</Text>
              )}
            </View>
          )}
        </View>
      </View>

      {isAgent && !showAvatar && <View style={styles.avatarPlaceholder} />}
      {isAgent && showAvatar && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials()}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  agentContainer: {
    justifyContent: 'flex-end',
  },
  customerContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: theme.spacing.xs,
  },
  avatarText: {
    ...theme.typography.caption,
    color: theme.colors.primaryForeground,
    fontWeight: '600',
  },
  avatarPlaceholder: {
    width: 32,
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
  },
  agentBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  customerBubble: {
    backgroundColor: theme.colors.card,
    borderBottomLeftRadius: 4,
  },
  text: {
    ...theme.typography.bodySmall,
  },
  agentText: {
    color: theme.colors.primaryForeground,
  },
  customerText: {
    color: theme.colors.foreground,
  },
  mediaContainer: {
    marginBottom: theme.spacing.xs,
  },
  mediaText: {
    ...theme.typography.caption,
    color: theme.colors.mutedForeground,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  timestamp: {
    ...theme.typography.caption,
    fontSize: 10,
  },
  agentTimestamp: {
    color: theme.colors.primaryForeground,
    opacity: 0.7,
  },
  customerTimestamp: {
    color: theme.colors.mutedForeground,
  },
  statusContainer: {
    marginLeft: theme.spacing.xs,
  },
  statusIcon: {
    fontSize: 12,
    color: theme.colors.primaryForeground,
    opacity: 0.7,
  },
  statusRead: {
    color: theme.colors.info,
  },
});

// Memoize component to prevent unnecessary re-renders
// Returns true if props are equal (skip re-render), false if different (re-render)
export const MessageBubble = React.memo(MessageBubbleComponent, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render)
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.text === nextProps.message.text &&
    prevProps.message.timestamp === nextProps.message.timestamp &&
    prevProps.message.deliveryStatus === nextProps.message.deliveryStatus &&
    prevProps.isAgent === nextProps.isAgent &&
    prevProps.contactName === nextProps.contactName &&
    prevProps.agentName === nextProps.agentName
  );
});

