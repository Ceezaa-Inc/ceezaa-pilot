import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Modal, Button } from '@/components/ui';
import { useSessionStore, Session } from '@/stores/useSessionStore';

interface SessionPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectSession: (session: Session) => void;
  onCreateNew: () => void;
  isLoading?: boolean;
}

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

export function SessionPickerModal({
  visible,
  onClose,
  onSelectSession,
  onCreateNew,
  isLoading,
}: SessionPickerModalProps) {
  const { activeSessions } = useSessionStore();

  // Filter to only show sessions that are in voting status (can add venues)
  const votingSessions = activeSessions.filter((s) => s.status === 'voting');

  const renderSessionItem = ({ item }: { item: Session }) => (
    <TouchableOpacity
      style={styles.sessionItem}
      onPress={() => onSelectSession(item)}
      activeOpacity={0.7}
    >
      <View style={styles.sessionIcon}>
        <Typography variant="body">🗳️</Typography>
      </View>
      <View style={styles.sessionInfo}>
        <Typography variant="body" color="primary" numberOfLines={1}>
          {item.name}
        </Typography>
        <Typography variant="caption" color="muted">
          {item.venues.length} venue{item.venues.length !== 1 ? 's' : ''}
          {item.date ? ` • ${formatDate(item.date)}` : ''}
        </Typography>
      </View>
      <View style={styles.selectIndicator}>
        <Typography variant="caption" color="gold">Select</Typography>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Typography variant="body" color="muted" align="center">
        No active sessions
      </Typography>
      <Typography variant="caption" color="muted" align="center" style={{ marginTop: 8 }}>
        Create a new session to start adding venues
      </Typography>
    </View>
  );

  return (
    <Modal visible={visible} onClose={onClose} showCloseButton>
      <View style={styles.container}>
        <Typography variant="h3" color="primary" align="center">
          Add to Session
        </Typography>
        <Typography variant="body" color="secondary" align="center" style={styles.subtitle}>
          Choose a session or create a new one
        </Typography>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary.DEFAULT} />
          </View>
        ) : votingSessions.length > 0 ? (
          <FlatList
            data={votingSessions}
            keyExtractor={(item) => item.id}
            renderItem={renderSessionItem}
            style={styles.sessionList}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={<View style={{ height: layoutSpacing.sm }} />}
          />
        ) : (
          renderEmptyState()
        )}

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Typography variant="caption" color="muted" style={styles.dividerText}>
            OR
          </Typography>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.actions}>
          <Button
            label="+ Create New Session"
            variant="secondary"
            fullWidth
            onPress={onCreateNew}
          />
          <Button label="Cancel" variant="ghost" fullWidth onPress={onClose} />
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
  loadingContainer: {
    paddingVertical: layoutSpacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionList: {
    maxHeight: 250,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: layoutSpacing.sm,
    paddingHorizontal: layoutSpacing.sm,
    backgroundColor: colors.dark.surfaceAlt,
    borderRadius: borderRadius.md,
    marginBottom: layoutSpacing.sm,
  },
  sessionIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
    marginLeft: layoutSpacing.sm,
    gap: 2,
  },
  selectIndicator: {
    paddingHorizontal: layoutSpacing.sm,
  },
  emptyContainer: {
    paddingVertical: layoutSpacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: layoutSpacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.dark.border,
  },
  dividerText: {
    marginHorizontal: layoutSpacing.md,
  },
  actions: {
    gap: layoutSpacing.sm,
  },
});
