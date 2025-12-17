import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { Button, Typography, Card, LoadingSpinner } from '@/components/ui';
import { TasteRing } from '@/components/pulse/TasteRing';
import { useTasteStore, useAuthStore } from '@/stores';

export default function EnhancedRevealScreen() {
  const { traits, insights, categories, fetchFusedProfile } = useTasteStore();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  useEffect(() => {
    const loadFusedProfile = async () => {
      if (user?.id) {
        try {
          console.log('[EnhancedReveal] Fetching fused profile for:', user.id);
          await fetchFusedProfile(user.id);
        } catch (error) {
          console.error('[EnhancedReveal] Failed to fetch fused profile:', error);
        }
      }

      // Show reveal animation after loading
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
    };

    loadFusedProfile();
  }, [user?.id]);

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

        <View style={styles.insights}>
          <Typography variant="label" color="muted">
            Key Insights
          </Typography>
          <View style={styles.insightsList}>
            {insights.slice(0, 3).map((insight) => (
              <View key={insight.id} style={styles.insightRow}>
                <Typography variant="body">{insight.emoji}</Typography>
                <Typography variant="bodySmall" color="secondary">
                  {insight.description}
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
