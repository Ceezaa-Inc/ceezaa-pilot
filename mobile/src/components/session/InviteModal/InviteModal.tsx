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
import { UserSearchResult, InviteRequest } from '@/services/api';

export interface SelectedUser {
  id: string;
  display_name: string | null;
}

interface InviteModalProps {
  visible: boolean;
  onClose: () => void;
  mode: 'select' | 'invite';
  // For mode="invite" (existing session)
  sessionId?: string;
  userId?: string;
  onInvitesSent?: (sent: number) => void;
  // For mode="select" (new session creation)
  onSelectUsers?: (users: SelectedUser[]) => void;
  initialSelected?: SelectedUser[];
}

type TabType = 'search' | 'contacts';

export function InviteModal({
  visible,
  onClose,
  mode,
  sessionId,
  userId,
  onInvitesSent,
  onSelectUsers,
  initialSelected = [],
}: InviteModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { searchUsers, sendInvitations } = useSessionStore();

  // Initialize with initial selected users in select mode
  React.useEffect(() => {
    if (visible && mode === 'select' && initialSelected.length > 0) {
      // Convert SelectedUser to UserSearchResult format
      setSelectedUsers(initialSelected.map(u => ({
        id: u.id,
        display_name: u.display_name,
      })));
    }
  }, [visible, mode, initialSelected]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    setError(null);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchUsers(query, 'username');
      // Filter out already selected users
      const filtered = results.filter(
        (r) => !selectedUsers.find((s) => s.id === r.id) && r.id !== userId
      );
      setSearchResults(filtered);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  }, [searchUsers, selectedUsers, userId]);

  const handleSelectUser = (user: UserSearchResult) => {
    if (selectedUsers.find((s) => s.id === user.id)) {
      return;
    }
    setSelectedUsers([...selectedUsers, user]);
    setSearchResults(searchResults.filter((r) => r.id !== user.id));
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  const handleAction = async () => {
    if (selectedUsers.length === 0) return;

    if (mode === 'select') {
      // Select mode - just return selected users
      onSelectUsers?.(selectedUsers.map(u => ({
        id: u.id,
        display_name: u.display_name,
      })));
      handleClose();
      return;
    }

    // Invite mode - send invitations
    if (!sessionId || !userId) return;

    setIsSending(true);
    setError(null);

    try {
      const data: InviteRequest = {
        user_ids: selectedUsers.map((u) => u.id),
      };

      const result = await sendInvitations(sessionId, data, userId);

      if (result) {
        onInvitesSent?.(result.sent);
        handleClose();
      } else {
        setError('Failed to send invitations');
      }
    } catch (err) {
      console.error('Failed to send invitations:', err);
      setError('Failed to send invitations');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUsers([]);
    setError(null);
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
      <View style={styles.checkbox}>
        <Typography variant="body" color="primary">+</Typography>
      </View>
    </TouchableOpacity>
  );

  const renderSearchTab = () => (
    <View style={styles.tabContent}>
      <Input
        placeholder="Search by username..."
        value={searchQuery}
        onChangeText={handleSearch}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {renderSelectedChips()}

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
  );

  const renderContactsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.comingSoonContainer}>
        <Typography variant="body" color="muted" align="center">
          Contact sync coming soon
        </Typography>
        <Typography variant="caption" color="muted" align="center" style={{ marginTop: 8 }}>
          Use username search for now
        </Typography>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} onClose={handleClose} showCloseButton closeOnBackdrop={false}>
      <View style={styles.container}>
        <Typography variant="h3" color="primary" align="center">
          Invite Friends
        </Typography>
        <Typography variant="body" color="secondary" align="center" style={styles.subtitle}>
          {mode === 'select' ? 'Search by username' : 'Search for friends to invite to this session'}
        </Typography>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'search' && styles.activeTab]}
            onPress={() => setActiveTab('search')}
          >
            <Typography
              variant="bodySmall"
              color={activeTab === 'search' ? 'primary' : 'muted'}
            >
              Search Users
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'contacts' && styles.activeTab]}
            onPress={() => setActiveTab('contacts')}
          >
            <Typography
              variant="bodySmall"
              color={activeTab === 'contacts' ? 'primary' : 'muted'}
            >
              Contacts
            </Typography>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'search' ? renderSearchTab() : renderContactsTab()}

        {error && (
          <Typography variant="caption" style={styles.error} align="center">
            {error}
          </Typography>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            label={
              mode === 'select'
                ? `Done${selectedUsers.length > 0 ? ` (${selectedUsers.length})` : ''}`
                : isSending
                  ? 'Sending...'
                  : `Send Invitations${selectedUsers.length > 0 ? ` (${selectedUsers.length})` : ''}`
            }
            fullWidth
            onPress={handleAction}
            disabled={selectedUsers.length === 0 || isSending}
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.dark.surfaceAlt,
    borderRadius: borderRadius.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: layoutSpacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  activeTab: {
    backgroundColor: colors.dark.surface,
  },
  tabContent: {
    minHeight: 200,
    maxHeight: 300,
  },
  chipsContainer: {
    marginTop: layoutSpacing.sm,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: layoutSpacing.xl,
  },
  resultsList: {
    marginTop: layoutSpacing.sm,
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
  checkbox: {
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
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: layoutSpacing.xl,
  },
  error: {
    color: '#FF6B6B',
  },
  actions: {
    gap: layoutSpacing.sm,
    marginTop: layoutSpacing.sm,
  },
});
