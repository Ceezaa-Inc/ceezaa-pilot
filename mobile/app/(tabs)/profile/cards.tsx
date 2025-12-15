import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { create, open, dismissLink, LinkSuccess, LinkExit } from 'react-native-plaid-link-sdk';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Card, Button } from '@/components/ui';
import { plaidService, LinkedAccount } from '@/services/plaid';

// TODO: Replace with actual user ID from auth
const TEMP_USER_ID = 'temp-user-123';

export default function LinkedCardsScreen() {
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await plaidService.getLinkedAccounts(TEMP_USER_ID);
      setAccounts(data);
    } catch (error) {
      console.error('[Cards] Failed to fetch accounts:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAccounts();
  }, [fetchAccounts]);

  const handleAddBank = useCallback(async () => {
    setIsLinking(true);
    try {
      const { link_token } = await plaidService.createLinkToken(TEMP_USER_ID);

      create({ token: link_token });
      open({
        onSuccess: async (success: LinkSuccess) => {
          try {
            await plaidService.exchangeToken(
              success.publicToken,
              TEMP_USER_ID,
              success.metadata.institution?.id,
              success.metadata.institution?.name
            );
            dismissLink();
            fetchAccounts();
            Alert.alert('Success', 'Bank linked successfully!');
          } catch (error) {
            console.error('[Cards] Token exchange failed:', error);
            Alert.alert('Error', 'Failed to link bank.');
          }
          setIsLinking(false);
        },
        onExit: (exit: LinkExit) => {
          if (exit.error) {
            Alert.alert('Error', exit.error.errorMessage || 'Something went wrong');
          }
          setIsLinking(false);
        },
      });
    } catch (error) {
      console.error('[Cards] Failed to create link token:', error);
      Alert.alert('Error', 'Failed to initialize bank connection.');
      setIsLinking(false);
    }
  }, [fetchAccounts]);

  const handleRemoveCard = (account: LinkedAccount) => {
    Alert.alert(
      'Remove Bank',
      `Are you sure you want to remove ${account.institution_name || 'this bank'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await plaidService.deleteAccount(account.id);
              setAccounts(accounts.filter((a) => a.id !== account.id));
            } catch (error) {
              console.error('[Cards] Failed to remove account:', error);
              Alert.alert('Error', 'Failed to remove bank account.');
            }
          },
        },
      ]
    );
  };

  const handleViewTransactions = (account: LinkedAccount) => {
    // Using type assertion since expo-router types may not be regenerated yet
    router.push({
      pathname: '/(tabs)/profile/transactions' as const,
      params: { accountId: account.id, bankName: account.institution_name || 'Bank' },
    } as any);
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
            Linked Banks
          </Typography>
          <Typography variant="body" color="secondary">
            Connect your banks to track dining expenses automatically
          </Typography>
        </View>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.emptyState}>
            <Typography variant="body" color="secondary">
              Loading...
            </Typography>
          </View>
        )}

        {/* Empty State */}
        {!isLoading && accounts.length === 0 && (
          <View style={styles.emptyState}>
            <Typography variant="h3" color="secondary">
              No banks linked yet
            </Typography>
            <Typography variant="body" color="muted" style={styles.emptyText}>
              Link a bank account to see your dining transactions
            </Typography>
          </View>
        )}

        {/* Cards List */}
        <View style={styles.cardsList}>
          {accounts.map((account) => (
            <Card key={account.id} variant="default" padding="lg" style={styles.cardItem}>
              <TouchableOpacity onPress={() => handleViewTransactions(account)}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardIcon}>
                    <Typography variant="h3">🏦</Typography>
                  </View>
                  <View style={styles.cardInfo}>
                    <Typography variant="h4" color="primary">
                      {account.institution_name || 'Bank Account'}
                    </Typography>
                    <Typography variant="bodySmall" color="secondary">
                      Tap to view transactions
                    </Typography>
                  </View>
                  <Typography variant="body" color="secondary">
                    →
                  </Typography>
                </View>
              </TouchableOpacity>

              <View style={styles.cardStats}>
                <View style={styles.cardStat}>
                  <Typography variant="bodySmall" color="muted">
                    Last synced
                  </Typography>
                  <Typography variant="bodySmall" color="secondary">
                    {account.last_synced_at
                      ? new Date(account.last_synced_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Never'}
                  </Typography>
                </View>
                <View style={styles.cardStat}>
                  <Typography variant="bodySmall" color="muted">
                    Linked on
                  </Typography>
                  <Typography variant="bodySmall" color="secondary">
                    {new Date(account.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Typography>
                </View>
              </View>

              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveCard(account)}
              >
                <Typography variant="bodySmall" color="error">
                  Remove Bank
                </Typography>
              </TouchableOpacity>
            </Card>
          ))}
        </View>

        {/* Add Bank Button */}
        <Button
          label={isLinking ? 'Linking...' : '+ Link Bank Account'}
          fullWidth
          onPress={handleAddBank}
          loading={isLinking}
        />

        {/* Info Section */}
        <Card variant="outlined" padding="md" style={styles.infoCard}>
          <Typography variant="bodySmall" color="secondary">
            Your data is securely processed through Plaid. We only access transaction information
            for dining establishments - never your full card number or account balance.
          </Typography>
        </Card>
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: layoutSpacing.xl,
    gap: layoutSpacing.sm,
  },
  emptyText: {
    textAlign: 'center',
  },
  cardsList: {
    gap: layoutSpacing.md,
  },
  cardItem: {
    gap: layoutSpacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.md,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.dark.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: layoutSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
  cardStat: {
    gap: 2,
  },
  removeButton: {
    alignSelf: 'flex-start',
    paddingVertical: layoutSpacing.xs,
  },
  infoCard: {
    backgroundColor: colors.dark.surfaceAlt,
  },
});
