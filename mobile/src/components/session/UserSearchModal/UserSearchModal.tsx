import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Modal, Button, Input } from '@/components/ui';
import { useSessionStore } from '@/stores/useSessionStore';
import { UserSearchResult } from '@/services/api';

interface UserSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectUsers: (users: UserSearchResult[]) => void;
  currentUserId: string;
  initialSelected?: UserSearchResult[];
}

export function UserSearchModal({
  visible,
  onClose,
  onSelectUsers,
  currentUserId,
  initialSelected = [],
}: UserSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserSearchResult[]>(initialSelected);
  const [isSearching, setIsSearching] = useState(false);

  const { searchUsers } = useSessionStore();

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchUsers(query, 'username');
      // Filter out already selected users and current user
      const filtered = results.filter(
        (r) => !selectedUsers.find((s) => s.id === r.id) && r.id !== currentUserId
      );
      setSearchResults(filtered);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  }, [searchUsers, selectedUsers, currentUserId]);

  const handleSelectUser = (user: UserSearchResult) => {
    if (selectedUsers.find((s) => s.id === user.id)) return;
    setSelectedUsers([...selectedUsers, user]);
    setSearchResults(searchResults.filter((r) => r.id !== user.id));
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  const handleDone = () => {
    onSelectUsers(selectedUsers);
    handleClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  const renderSelectedChips = () => {
    if (selectedUsers.length === 0) return null;

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsContainer}
        contentContainerStyle={styles.chipsContent}
      >
        {selectedUsers.map((user) => (
          <View key={user.id} style={styles.chip}>
            <Typography variant="caption" color="primary">
              {user.display_name || 'User'}
            </Typography>
            <TouchableOpacity
              onPress={() => handleRemoveUser(user.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Typography variant="caption" color="muted" style={styles.chipRemove}>
                ×
              </Typography>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderSearchResult = ({ item }: { item: UserSearchResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleSelectUser(item)}
      activeOpacity={0.7}
    >
      <View style={styles.resultAvatar}>
        <Typography variant="body" color="primary">
          {(item.display_name || 'U').charAt(0).toUpperCase()}
        </Typography>
      </View>
      <View style={styles.resultInfo}>
        <Typography variant="body" color="primary">
          {item.display_name || 'Unknown User'}
        </Typography>
      </View>
      <View style={styles.addButton}>
        <Typography variant="body" color="primary">+</Typography>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} onClose={handleClose} showCloseButton closeOnBackdrop={false}>
      <View style={styles.container}>
        <Typography variant="h3" color="primary" align="center">
          Find Friends
        </Typography>
        <Typography variant="body" color="secondary" align="center" style={styles.subtitle}>
          Search by username
        </Typography>

        <Input
          placeholder="Search by username..."
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {renderSelectedChips()}

        <View style={styles.resultsContainer}>
          {isSearching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary.DEFAULT} />
            </View>
          ) : searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={renderSearchResult}
              style={styles.resultsList}
              showsVerticalScrollIndicator={false}
            />
          ) : searchQuery.length >= 2 ? (
            <View style={styles.emptyContainer}>
              <Typography variant="body" color="muted" align="center">
                No users found
              </Typography>
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          <Button
            label={`Done${selectedUsers.length > 0 ? ` (${selectedUsers.length})` : ''}`}
            fullWidth
            onPress={handleDone}
          />
          <Button label="Cancel" variant="ghost" fullWidth onPress={handleClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: layoutSpacing.md,
    paddingTop: layoutSpacing.md,
  },
  subtitle: {
    marginBottom: layoutSpacing.xs,
  },
  chipsContainer: {
    maxHeight: 40,
  },
  chipsContent: {
    gap: layoutSpacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.surfaceAlt,
    paddingHorizontal: layoutSpacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    marginRight: layoutSpacing.xs,
    borderWidth: 1,
    borderColor: colors.primary.DEFAULT,
  },
  chipRemove: {
    marginLeft: 6,
    fontSize: 18,
  },
  resultsContainer: {
    minHeight: 150,
    maxHeight: 200,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: layoutSpacing.xl,
  },
  resultsList: {
    marginTop: layoutSpacing.xs,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: layoutSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  resultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dark.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultInfo: {
    flex: 1,
    marginLeft: layoutSpacing.sm,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: layoutSpacing.xl,
  },
  actions: {
    gap: layoutSpacing.sm,
    marginTop: layoutSpacing.sm,
  },
});
