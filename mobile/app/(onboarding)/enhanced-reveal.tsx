import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { Button, Typography, Card, LoadingSpinner } from '@/components/ui';

const ENHANCED_TRAITS = [
  { label: 'Adventurous', value: 85, color: colors.mood.adventurous.start },
  { label: 'Social', value: 72, color: colors.mood.social.start },
  { label: 'Refined', value: 91, color: colors.primary.DEFAULT },
  { label: 'Cozy', value: 58, color: colors.mood.cozy.start },
];

const INSIGHTS = [
  { emoji: '🍕', text: 'Italian is your top cuisine' },
  { emoji: '🌃', text: 'You prefer evening dining' },
  { emoji: '👥', text: 'Usually dine in groups of 2-4' },
];

export default function EnhancedRevealScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = () => {
    router.replace('/(tabs)/pulse');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Typography variant="h3" color="primary" align="center" style={styles.loadingText}>
            Combining your data...
          </Typography>
          <Typography variant="body" color="secondary" align="center">
            Quiz answers + Transaction history
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.header}>
          <Typography variant="h2" color="primary" align="center">
            Your Enhanced Profile
          </Typography>
          <Typography variant="body" color="gold" align="center">
            ✨ Now powered by real data
          </Typography>
        </View>

        <Card variant="elevated" padding="lg" style={styles.tasteCard}>
          <View style={styles.scoreSection}>
            <View style={styles.ringOuter}>
              <View style={styles.ringMiddle}>
                <View style={styles.ringInner}>
                  <Typography variant="h1" color="gold">
                    91
                  </Typography>
                  <Typography variant="caption" color="secondary">
                    Taste Score
                  </Typography>
                </View>
              </View>
            </View>
            <View style={styles.scoreBadge}>
              <Typography variant="caption" color="gold">
                +9 from transactions
              </Typography>
            </View>
          </View>

          <View style={styles.traits}>
            {ENHANCED_TRAITS.map((trait) => (
              <View key={trait.label} style={styles.traitRow}>
                <Typography variant="bodySmall" color="secondary" style={styles.traitLabel}>
                  {trait.label}
                </Typography>
                <View style={styles.traitBar}>
                  <View
                    style={[
                      styles.traitFill,
                      { width: `${trait.value}%`, backgroundColor: trait.color },
                    ]}
                  />
                </View>
                <Typography variant="caption" color="muted">
                  {trait.value}%
                </Typography>
              </View>
            ))}
          </View>
        </Card>

        <View style={styles.insights}>
          <Typography variant="label" color="muted">
            Key Insights
          </Typography>
          <View style={styles.insightsList}>
            {INSIGHTS.map((insight, index) => (
              <View key={index} style={styles.insightRow}>
                <Typography variant="body">{insight.emoji}</Typography>
                <Typography variant="bodySmall" color="secondary">
                  {insight.text}
                </Typography>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <Button label="Start Exploring" fullWidth onPress={handleGetStarted} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: layoutSpacing.md,
  },
  loadingText: {
    marginTop: layoutSpacing.lg,
  },
  content: {
    flex: 1,
    paddingHorizontal: layoutSpacing.lg,
    paddingTop: layoutSpacing.lg,
  },
  header: {
    marginBottom: layoutSpacing.lg,
    gap: layoutSpacing.xs,
  },
  tasteCard: {
    alignItems: 'center',
    gap: layoutSpacing.lg,
  },
  scoreSection: {
    alignItems: 'center',
  },
  ringOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: colors.primary.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringMiddle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
    borderColor: colors.primary.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringInner: {
    alignItems: 'center',
  },
  scoreBadge: {
    marginTop: layoutSpacing.sm,
    paddingHorizontal: layoutSpacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.primary.muted,
    borderRadius: 12,
  },
  traits: {
    width: '100%',
    gap: layoutSpacing.sm,
  },
  traitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.sm,
  },
  traitLabel: {
    width: 100,
  },
  traitBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.dark.surfaceAlt,
    borderRadius: 4,
    overflow: 'hidden',
  },
  traitFill: {
    height: '100%',
    borderRadius: 4,
  },
  insights: {
    marginTop: layoutSpacing.lg,
    gap: layoutSpacing.sm,
  },
  insightsList: {
    gap: layoutSpacing.xs,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.sm,
  },
  footer: {
    paddingHorizontal: layoutSpacing.lg,
    paddingBottom: layoutSpacing.lg,
  },
});
