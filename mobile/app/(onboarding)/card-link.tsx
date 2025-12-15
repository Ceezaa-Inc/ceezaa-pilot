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
import { Button, Typography, Card } from '@/components/ui';
import { plaidService } from '@/services/plaid';

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

// TODO: Replace with actual user ID from auth
const TEMP_USER_ID = 'temp-user-123';

export default function CardLinkScreen() {
  const [isLinking, setIsLinking] = useState(false);

  const handleLinkCard = useCallback(async () => {
    setIsLinking(true);

    try {
      // Step 1: Get link token from backend
      console.log('[Plaid] Creating link token...');
      const { link_token } = await plaidService.createLinkToken(TEMP_USER_ID);
      console.log('[Plaid] Link token received');

      // Step 2: Configure Plaid Link
      const linkOpenProps: LinkOpenProps = {
        onSuccess: async (success: LinkSuccess) => {
          console.log('[Plaid] Link success:', success.metadata.institution?.name);

          try {
            // Step 3: Exchange public token for access token
            await plaidService.exchangeToken(
              success.publicToken,
              TEMP_USER_ID,
              success.metadata.institution?.id,
              success.metadata.institution?.name
            );

            console.log('[Plaid] Token exchanged successfully');
            dismissLink();

            // Navigate to next screen
            router.push('/(onboarding)/enhanced-reveal');
          } catch (error) {
            console.error('[Plaid] Token exchange failed:', error);
            Alert.alert('Error', 'Failed to link your bank account. Please try again.');
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
  }, []);

  const handleSkip = () => {
    router.replace('/(tabs)/pulse');
  };

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
          label="Skip for now"
          variant="ghost"
          fullWidth
          onPress={handleSkip}
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
