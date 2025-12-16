import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { Button, Typography, Card, LoadingSpinner } from '@/components/ui';
import { TasteRing } from '@/components/pulse/TasteRing';
import { useTasteStore, useAuthStore } from '@/stores';

export default function InitialTasteScreen() {
  const { profile, traits, isLoading, fetchProfile, hasFetched } = useTasteStore();
  const { user } = useAuthStore();
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Fetch profile from API when user is available
    if (user?.id && !hasFetched) {
      fetchProfile(user.id);
    }
  }, [user?.id, hasFetched, fetchProfile]);

  useEffect(() => {
    // Animate in when loading is done
    if (!isLoading && hasFetched) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading, hasFetched, fadeAnim]);

  const handleContinue = () => {
    router.push('/(onboarding)/card-link');
  };

  if (isLoading || !hasFetched) {
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
          <Typography variant="body" color="secondary" align="center" style={styles.tagline}>
            "{profile.tagline}"
          </Typography>
        </View>

        <Card variant="elevated" padding="lg" style={styles.tasteCard}>
          <TasteRing size={200} showCard={false} onPress={() => {}} />

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
    gap: layoutSpacing.sm,
    alignItems: 'center',
  },
  tagline: {
    fontWeight: '600',
    marginTop: layoutSpacing.xs,
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
