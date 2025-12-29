import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  create,
  open,
  dismissLink,
  LinkSuccess,
  LinkExit,
  LinkOpenProps,
} from 'react-native-plaid-link-sdk';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { Button, Typography, Card, LoadingSpinner } from '@/components/ui';
import { plaidService } from '@/services/plaid';
import { useAuthStore } from '@/stores';
import { tasteApi } from '@/services/api';

const BENEFITS = [
  {
    icon: '🎯',
    title: 'Better Recommendations',
    description: 'We learn from your actual dining history',
  },
  {
    icon: '📊',
    title: 'Spending Insights',
    description: 'Track where and how you dine out',
  },
  {
    icon: '🔒',
    title: 'Bank-Level Security',
    description: 'Read-only access, fully encrypted',
  },
];

export default function CardLinkScreen() {
  const [isLinking, setIsLinking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const { user } = useAuthStore();

  // Get the authenticated user's ID
  const userId = user?.id;

  const handleLinkCard = useCallback(async () => {
    if (!userId) {
      Alert.alert('Error', 'You must be logged in to link a card.');
      return;
    }

    setIsLinking(true);

    try {
      // Step 1: Get link token from backend
      console.log('[Plaid] Creating link token...');
      const { link_token } = await plaidService.createLinkToken(userId);
      console.log('[Plaid] Link token received');

      // Step 2: Configure Plaid Link
      const linkOpenProps: LinkOpenProps = {
        onSuccess: async (success: LinkSuccess) => {
          console.log('[Plaid] Link success:', success.metadata.institution?.name);
          dismissLink();

          try {
            // Step 3: Exchange public token for access token
            setSyncMessage('Linking account...');
            setIsSyncing(true);

            const { account_id } = await plaidService.exchangeToken(
              success.publicToken,
              userId,
              success.metadata.institution?.id,
              success.metadata.institution?.name
            );

            console.log('[Plaid] Token exchanged, account_id:', account_id);

            // Step 4: Sync transactions (triggers aggregation on backend)
            setSyncMessage('Fetching transactions...');
            const syncResult = await plaidService.syncTransactions(account_id);
            const totalTxns = syncResult.added.length + syncResult.modified.length;

            console.log(`[Plaid] Synced ${totalTxns} transactions`);
            setSyncMessage(`Analyzing ${totalTxns} transactions...`);

            // Brief delay to show the analysis message
            await new Promise((resolve) => setTimeout(resolve, 1000));

            setIsSyncing(false);

            // Navigate to next screen
            router.push('/(onboarding)/enhanced-reveal');
          } catch (error) {
            console.error('[Plaid] Sync failed:', error);
            setIsSyncing(false);
            Alert.alert('Error', 'Failed to sync transactions. Please try again.');
          }
        },
        onExit: (exit: LinkExit) => {
          console.log('[Plaid] Link exited:', exit.error?.errorMessage || 'User cancelled');
          if (exit.error) {
            Alert.alert('Error', exit.error.errorMessage || 'Something went wrong');
          }
          setIsLinking(false);
        },
      };

      // Step 4: Create and open Plaid Link
      create({ token: link_token });
      open(linkOpenProps);
    } catch (error) {
      console.error('[Plaid] Failed to create link token:', error);
      Alert.alert('Error', 'Failed to initialize bank connection. Please try again.');
      setIsLinking(false);
    }
  }, [userId]);

  // Use cached data for testing (bypasses Plaid linking)
  // Uses the seeded dev user ID from 008_seed_dev_user.sql
  const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';

  const handleUseCache = useCallback(async () => {
    setIsSyncing(true);
    setSyncMessage('Checking cached data...');

    try {
      // Fetch fused taste via backend API (bypasses RLS)
      const fusedTaste = await tasteApi.getFused(DEV_USER_ID);

      console.log('[CardLink] Cache check result:', { fusedTaste, userId: DEV_USER_ID });

      if (!fusedTaste || !fusedTaste.categories || fusedTaste.categories.length === 0) {
        Alert.alert('No cached data', 'No fused taste data found for dev user.');
        setIsSyncing(false);
        return;
      }

      console.log('[CardLink] Using cached fused_taste data for dev user');
      setSyncMessage('Loading your taste profile...');
      await new Promise((resolve) => setTimeout(resolve, 500));

      setIsSyncing(false);
      // Pass dev user ID as query param so enhanced-reveal uses it
      router.push(`/(onboarding)/enhanced-reveal?dev_user=${DEV_USER_ID}`);
    } catch (err) {
      console.error('[CardLink] Cache check failed:', err);
      Alert.alert('Error', 'Failed to load cached data. Make sure dev user has transaction data.');
      setIsSyncing(false);
    }
  }, []);

  // Show syncing progress overlay
  if (isSyncing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.syncingContainer}>
          <LoadingSpinner size="large" />
          <Typography variant="h3" style={styles.darkText}>
            {syncMessage}
          </Typography>
          <Typography variant="body" style={styles.mutedText}>
            This may take a moment
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Typography variant="h2" style={styles.darkText}>
            Supercharge Your Profile
          </Typography>
          <Typography variant="body" style={styles.mutedText}>
            Link your card to unlock personalized insights
          </Typography>
        </View>

        <View style={styles.benefits}>
          {BENEFITS.map((benefit, index) => (
            <Card key={index} variant="trust" padding="md" style={styles.benefitCard}>
              <View style={styles.benefitRow}>
                <Typography variant="h3">{benefit.icon}</Typography>
                <View style={styles.benefitText}>
                  <Typography variant="h4" style={styles.darkText}>
                    {benefit.title}
                  </Typography>
                  <Typography variant="bodySmall" style={styles.mutedText}>
                    {benefit.description}
                  </Typography>
                </View>
              </View>
            </Card>
          ))}
        </View>

        <View style={styles.securityBadge}>
          <View style={styles.lockIcon}>
            <Typography variant="body">🔐</Typography>
          </View>
          <Typography variant="caption" style={styles.mutedText}>
            Powered by Plaid • 256-bit encryption • Read-only access
          </Typography>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          label="Link Your Card"
          fullWidth
          loading={isLinking}
          onPress={handleLinkCard}
        />
        <Button
          label="Use Cache (Dev)"
          variant="ghost"
          fullWidth
          onPress={handleUseCache}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.trust.background,
  },
  syncingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: layoutSpacing.md,
    paddingHorizontal: layoutSpacing.xl,
  },
  content: {
    flex: 1,
    paddingHorizontal: layoutSpacing.lg,
    paddingTop: layoutSpacing.xl,
  },
  header: {
    marginBottom: layoutSpacing.xl,
    gap: layoutSpacing.xs,
  },
  darkText: {
    color: colors.trust.text,
  },
  mutedText: {
    color: colors.trust.textSecondary,
  },
  benefits: {
    gap: layoutSpacing.md,
  },
  benefitCard: {
    backgroundColor: colors.trust.surface,
    borderWidth: 1,
    borderColor: colors.trust.border,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.md,
  },
  benefitText: {
    flex: 1,
    gap: 2,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: layoutSpacing.xl,
    gap: layoutSpacing.sm,
  },
  lockIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.trust.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: layoutSpacing.lg,
    paddingBottom: layoutSpacing.lg,
    gap: layoutSpacing.sm,
  },
});
