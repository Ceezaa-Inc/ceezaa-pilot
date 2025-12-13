import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Button, Typography, Card, LoadingSpinner } from '@/components/ui';
import { TasteRing } from '@/components/pulse/TasteRing';
import { useTasteStore } from '@/stores';

export default function InitialTasteScreen() {
  const { traits } = useTasteStore();
  const [isLoading, setIsLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Simulate processing
    const timer = setTimeout(() => {
      setIsLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    router.push('/(onboarding)/card-link');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Typography variant="h3" color="primary" align="center" style={styles.loadingText}>
            Analyzing your taste...
          </Typography>
          <Typography variant="body" color="secondary" align="center">
            Creating your personalized profile
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <Typography variant="h2" color="primary" align="center">
            Your Taste DNA
          </Typography>
          <Typography variant="body" color="secondary" align="center">
            Based on your quiz responses
          </Typography>
        </View>

        <Card variant="elevated" padding="lg" style={styles.tasteCard}>
          <TasteRing size={160} showCard={false} onPress={() => {}} />

          <View style={styles.traits}>
            {traits.map((trait) => (
              <View key={trait.name} style={styles.traitRow}>
                <Typography variant="bodySmall" color="secondary" style={styles.traitLabel}>
                  {trait.emoji} {trait.name}
                </Typography>
                <View style={styles.traitBar}>
                  <View
                    style={[
                      styles.traitFill,
                      { width: `${trait.score}%`, backgroundColor: trait.color },
                    ]}
                  />
                </View>
                <Typography variant="caption" color="muted">
                  {trait.score}%
                </Typography>
              </View>
            ))}
          </View>
        </Card>

        <Typography variant="bodySmall" color="muted" align="center" style={styles.hint}>
          Link your card to enhance your profile with real dining data
        </Typography>
      </Animated.View>

      <View style={styles.footer}>
        <Button label="Continue" fullWidth onPress={handleContinue} />
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
    paddingTop: layoutSpacing.xl,
  },
  header: {
    marginBottom: layoutSpacing.xl,
    gap: layoutSpacing.xs,
  },
  tasteCard: {
    alignItems: 'center',
    gap: layoutSpacing.lg,
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
    width: 120,
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
  hint: {
    marginTop: layoutSpacing.lg,
  },
  footer: {
    paddingHorizontal: layoutSpacing.lg,
    paddingBottom: layoutSpacing.lg,
  },
});
