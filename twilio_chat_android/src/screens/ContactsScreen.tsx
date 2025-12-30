import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { apiService } from '../services/api';
import { theme } from '../theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { Contact } from '../types';

interface ContactsScreenProps {
  navigation: any;
}

export const ContactsScreen = ({ navigation }: ContactsScreenProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      const fetchedContacts = await apiService.getContacts();
      setContacts(fetchedContacts);
    } catch (error: any) {
      console.error('Failed to load contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContacts();
    setRefreshing(false);
  };

  // Filter contacts by search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const query = searchQuery.toLowerCase();
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(query) ||
        contact.phoneNumber?.includes(query) ||
        contact.email?.toLowerCase().includes(query)
    );
  }, [contacts, searchQuery]);

  const renderContactItem = ({ item }: { item: Contact }) => {
    const initials = item.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    return (
      <TouchableOpacity style={styles.contactItem}>
        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
        </View>

        <View style={styles.contactContent}>
          <Text style={styles.contactName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.phoneNumber && (
            <Text style={styles.contactPhone} numberOfLines={1}>
              {item.phoneNumber}
            </Text>
          )}
          {item.email && (
            <Text style={styles.contactEmail} numberOfLines={1}>
              {item.email}
            </Text>
          )}
        </View>

        {item.isActive && (
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading && contacts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading contacts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Contacts</Text>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color={theme.colors.mutedForeground} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          placeholderTextColor={theme.colors.mutedForeground}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={20} color={theme.colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredContacts}
        renderItem={renderContactItem}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="account-group-outline" size={64} color={theme.colors.mutedForeground} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No contacts found' : 'No contacts yet'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.foreground,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.foreground,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
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
  contactItem: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    alignItems: 'center',
  },
  avatarContainer: {
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
  contactContent: {
    flex: 1,
    justifyContent: 'center',
  },
  contactName: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  contactPhone: {
    ...theme.typography.bodySmall,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.xs / 2,
  },
  contactEmail: {
    ...theme.typography.bodySmall,
    color: theme.colors.mutedForeground,
  },
  activeBadge: {
    marginLeft: theme.spacing.sm,
  },
  activeDot: {
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

