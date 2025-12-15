import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Card, Button } from '@/components/ui';
import { plaidService, Transaction } from '@/services/plaid';

export default function TransactionsScreen() {
  const { accountId, bankName } = useLocalSearchParams<{
    accountId: string;
    bankName: string;
  }>();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const syncTransactions = useCallback(async () => {
    if (!accountId) return;

    try {
      const result = await plaidService.syncTransactions(accountId);

      // Add new transactions to the list
      setTransactions((prev) => {
        // Filter out any that were modified or removed
        const removedIds = new Set(result.removed);
        const modifiedIds = new Set(result.modified.map((t) => t.transaction_id));

        const filtered = prev.filter(
          (t) => !removedIds.has(t.transaction_id) && !modifiedIds.has(t.transaction_id)
        );

        // Add modified and new transactions
        return [...result.added, ...result.modified, ...filtered].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      });

      setHasMore(result.has_more);
    } catch (error) {
      console.error('[Transactions] Sync failed:', error);
    }
  }, [accountId]);

  const loadInitial = useCallback(async () => {
    setIsLoading(true);
    await syncTransactions();
    setIsLoading(false);
  }, [syncTransactions]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await syncTransactions();
    setRefreshing(false);
  }, [syncTransactions]);

  const handleSyncMore = async () => {
    setIsSyncing(true);
    await syncTransactions();
    setIsSyncing(false);
  };

  const formatAmount = (amount: number) => {
    // Plaid returns positive for debits (spending), negative for credits
    const sign = amount > 0 ? '-' : '+';
    return `${sign}$${Math.abs(amount).toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCategoryIcon = (categories: string[] | null) => {
    if (!categories || categories.length === 0) return '💳';

    const cat = categories[0].toLowerCase();
    if (cat.includes('food') || cat.includes('restaurant')) return '🍽️';
    if (cat.includes('coffee')) return '☕';
    if (cat.includes('bar') || cat.includes('alcohol')) return '🍺';
    if (cat.includes('grocery')) return '🛒';
    if (cat.includes('fast food')) return '🍔';
    return '💳';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Typography variant="body" color="primary">
              ← Back
            </Typography>
          </TouchableOpacity>
          <Typography variant="h2" color="primary">
            {bankName || 'Transactions'}
          </Typography>
          <Typography variant="body" color="secondary">
            Pull down to sync new transactions
          </Typography>
        </View>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.gold} />
            <Typography variant="body" color="secondary">
              Syncing transactions...
            </Typography>
          </View>
        )}

        {/* Empty State */}
        {!isLoading && transactions.length === 0 && (
          <View style={styles.emptyState}>
            <Typography variant="h3" color="secondary">
              No transactions yet
            </Typography>
            <Typography variant="body" color="muted" style={styles.emptyText}>
              Transactions will appear here after your first sync
            </Typography>
            <Button label="Sync Now" onPress={handleSyncMore} loading={isSyncing} />
          </View>
        )}

        {/* Transactions List */}
        {!isLoading && transactions.length > 0 && (
          <>
            <View style={styles.summary}>
              <Typography variant="h4" color="gold">
                {transactions.length} transactions
              </Typography>
            </View>

            <View style={styles.transactionsList}>
              {transactions.map((tx) => (
                <Card key={tx.transaction_id} variant="default" padding="md" style={styles.txCard}>
                  <View style={styles.txRow}>
                    <View style={styles.txIcon}>
                      <Typography variant="h4">{getCategoryIcon(tx.category)}</Typography>
                    </View>
                    <View style={styles.txInfo}>
                      <Typography variant="body" color="primary" numberOfLines={1}>
                        {tx.merchant_name || tx.name}
                      </Typography>
                      <Typography variant="caption" color="muted">
                        {formatDate(tx.date)}
                        {tx.pending && ' • Pending'}
                      </Typography>
                    </View>
                    <Typography
                      variant="body"
                      color={tx.amount > 0 ? 'error' : 'success'}
                      style={styles.txAmount}
                    >
                      {formatAmount(tx.amount)}
                    </Typography>
                  </View>
                  {tx.category && tx.category.length > 0 && (
                    <View style={styles.txCategories}>
                      {tx.category.slice(0, 2).map((cat, idx) => (
                        <View key={idx} style={styles.categoryTag}>
                          <Typography variant="caption" color="secondary">
                            {cat}
                          </Typography>
                        </View>
                      ))}
                    </View>
                  )}
                </Card>
              ))}
            </View>

            {hasMore && (
              <Button
                label={isSyncing ? 'Syncing...' : 'Load More'}
                variant="secondary"
                fullWidth
                onPress={handleSyncMore}
                loading={isSyncing}
              />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  content: {
    padding: layoutSpacing.lg,
    gap: layoutSpacing.lg,
  },
  header: {
    gap: layoutSpacing.sm,
  },
  backButton: {
    marginBottom: layoutSpacing.xs,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: layoutSpacing.xl * 2,
    gap: layoutSpacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: layoutSpacing.xl,
    gap: layoutSpacing.md,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: layoutSpacing.sm,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionsList: {
    gap: layoutSpacing.sm,
  },
  txCard: {
    gap: layoutSpacing.sm,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.md,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.dark.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txInfo: {
    flex: 1,
    gap: 2,
  },
  txAmount: {
    fontWeight: '600',
  },
  txCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layoutSpacing.xs,
    marginTop: layoutSpacing.xs,
  },
  categoryTag: {
    backgroundColor: colors.dark.surfaceAlt,
    paddingHorizontal: layoutSpacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
});
