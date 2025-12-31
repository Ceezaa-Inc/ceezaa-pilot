import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Share,
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
  sessionCode?: string;
  sessionName?: string;
  userId?: string;
  onInvitesSent?: (sent: number) => void;
  // For mode="select" (new session creation)
  onSelectUsers?: (users: SelectedUser[]) => void;
  initialSelected?: SelectedUser[];
}

type InviteTab = 'share' | 'search';

export function InviteModal({
  visible,
  onClose,
  mode,
  sessionId,
  sessionCode,
  sessionName,
  userId,
  onInvitesSent,
  onSelectUsers,
  initialSelected = [],
}: InviteModalProps) {
  const [activeTab, setActiveTab] = useState<InviteTab>('share');
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
      setSelectedUsers(
        initialSelected.map((u) => ({
          id: u.id,
          display_name: u.display_name,
        }))
      );
    }
  }, [visible, mode, initialSelected]);

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      setError(null);

      if (query.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchUsers(query, 'username');
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
    },
    [searchUsers, selectedUsers, userId]
  );

  const handleSelectUser = (user: UserSearchResult) => {
    if (selectedUsers.find((s) => s.id === user.id)) {
      return;
    }
    setSelectedUsers([...selectedUsers, user]);
    setSearchResults(searchResults.filter((r) => r.id !== user.id));
  };

  const handleRemoveUser = (removeUserId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== removeUserId));
  };

  const handleSendInvites = async () => {
    if (selectedUsers.length === 0 || !sessionId || !userId) return;

    setIsSending(true);
    setError(null);

    try {
      const data: InviteRequest = {
        user_ids: selectedUsers.map((u) => u.id),
      };

      const result = await sendInvitations(sessionId, data, userId);

      if (result) {
        onInvitesSent?.(result.sent);
        // Clear selection after sending
        setSelectedUsers([]);
        setSearchQuery('');
        setSearchResults([]);
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

  const handleSelectAction = async () => {
    if (selectedUsers.length === 0) return;

    onSelectUsers?.(
      selectedUsers.map((u) => ({
        id: u.id,
        display_name: u.display_name,
      }))
    );
    handleClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUsers([]);
    setError(null);
    onClose();
  };

  const handleShare = async () => {
    if (!sessionCode) return;

    try {
      const name = sessionName ? `"${sessionName}"` : '';
      await Share.share({
        message: `Join my Ceezaa session${name ? ` ${name}` : ''}!\n\nCode: ${sessionCode}\n\nOr tap: ceezaa://join/${sessionCode}`,
      });
    } catch (err) {
      // Handle silently - user cancelled
    }
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
        <Typography variant="body" color="primary">
          +
        </Typography>
      </View>
    </TouchableOpacity>
  );

  // Invite mode - tabbed interface
  if (mode === 'invite') {
    return (
      <Modal visible={visible} onClose={handleClose} showCloseButton closeOnBackdrop={false}>
        <View style={styles.container}>
          <Typography variant="h3" color="primary" align="center">
            Invite Friends
          </Typography>

          {/* Tab Bar */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'share' && styles.tabActive]}
              onPress={() => setActiveTab('share')}
            >
              <Typography
                variant="body"
                color={activeTab === 'share' ? 'gold' : 'muted'}
              >
                Share Link
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'search' && styles.tabActive]}
              onPress={() => setActiveTab('search')}
            >
              <Typography
                variant="body"
                color={activeTab === 'search' ? 'gold' : 'muted'}
              >
                Search Users
              </Typography>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'share' ? (
            <View style={styles.tabContent}>
              {sessionCode && (
                <View style={styles.shareSection}>
                  <View style={styles.codeContainer}>
                    <Typography variant="caption" color="muted">
                      Session Code
                    </Typography>
                    <Typography variant="h2" color="gold">
                      {sessionCode}
                    </Typography>
                  </View>
                  <Typography variant="body" color="secondary" align="center">
                    Share this code or link with friends to invite them
                  </Typography>
                  <Button label="Share invitation link" fullWidth onPress={handleShare} />
                </View>
              )}
            </View>
          ) : (
            <View style={styles.tabContent}>
              <Input
                placeholder="Search by username..."
                value={searchQuery}
                onChangeText={handleSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />

              {renderSelectedChips()}

              <View style={styles.searchResults}>
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
                ) : (
                  <View style={styles.emptyContainer}>
                    <Typography variant="body" color="muted" align="center">
                      Type a username to search
                    </Typography>
                  </View>
                )}
              </View>

              {error && (
                <Typography variant="caption" style={styles.error} align="center">
                  {error}
                </Typography>
              )}

              {selectedUsers.length > 0 && (
                <Button
                  label={isSending ? 'Sending...' : `Send Invites (${selectedUsers.length})`}
                  fullWidth
                  onPress={handleSendInvites}
                  disabled={isSending}
                />
              )}
            </View>
          )}
        </View>
      </Modal>
    );
  }

  // Select mode - search for users only
  return (
    <Modal visible={visible} onClose={handleClose} showCloseButton closeOnBackdrop={false}>
      <View style={styles.container}>
        <Typography variant="h3" color="primary" align="center">
          Add Friends
        </Typography>
        <Typography variant="body" color="secondary" align="center" style={styles.subtitle}>
          Search by username
        </Typography>

        <View style={styles.searchContent}>
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

        {error && (
          <Typography variant="caption" style={styles.error} align="center">
            {error}
          </Typography>
        )}

        <View style={styles.actions}>
          <Button
            label={`Done${selectedUsers.length > 0 ? ` (${selectedUsers.length})` : ''}`}
            fullWidth
            onPress={handleSelectAction}
            disabled={selectedUsers.length === 0}
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.dark.surface,
    borderRadius: borderRadius.lg,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: layoutSpacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  tabActive: {
    backgroundColor: colors.dark.surfaceAlt,
  },
  tabContent: {
    minHeight: 200,
    gap: layoutSpacing.md,
  },
  subtitle: {
    marginBottom: layoutSpacing.xs,
  },
  shareSection: {
    gap: layoutSpacing.md,
  },
  codeContainer: {
    alignItems: 'center',
    paddingVertical: layoutSpacing.lg,
    backgroundColor: colors.dark.surface,
    borderRadius: borderRadius.lg,
    gap: layoutSpacing.xs,
  },
  searchResults: {
    flex: 1,
    minHeight: 120,
  },
  searchContent: {
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
    paddingVertical: layoutSpacing.lg,
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
    paddingVertical: layoutSpacing.lg,
  },
  error: {
    color: '#FF6B6B',
  },
  actions: {
    gap: layoutSpacing.sm,
    marginTop: layoutSpacing.sm,
  },
});
