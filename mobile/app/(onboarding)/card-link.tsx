import React, { useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Button, Typography, Card } from '@/components/ui';

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

  const handleLinkCard = async () => {
    setIsLinking(true);
    // Simulate Plaid flow
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLinking(false);
    router.push('/(onboarding)/enhanced-reveal');
  };

  const handleSkip = () => {
    router.replace('/(tabs)/pulse');
  };

  return (
    // Trust Mode - Light theme for financial operations
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
