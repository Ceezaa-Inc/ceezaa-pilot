import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, ScrollView, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { Button, Typography, Card, LoadingSpinner } from '@/components/ui';
import { TasteRing } from '@/components/pulse/TasteRing';
import { useTasteStore, useAuthStore } from '@/stores';
import { tasteApi, ObservedTasteProfile } from '@/services/api';

// Category color mapping (matches backend TASTE_CATEGORIES)
const CATEGORY_COLORS: Record<string, string> = {
  coffee: '#8B4513',
  dining: '#6366F1',
  fast_food: '#F59E0B',
  nightlife: '#EC4899',
  entertainment: '#8B5CF6',
  fitness: '#22C55E',
  default: '#6B7280',
};

// Category emoji mapping (matches backend TASTE_CATEGORIES)
const CATEGORY_EMOJIS: Record<string, string> = {
  coffee: '☕',
  dining: '🍽️',
  fast_food: '🍔',
  nightlife: '🍸',
  entertainment: '🎬',
  fitness: '💪',
  default: '🍴',
};

// Categories to filter out from display
const HIDDEN_CATEGORIES = new Set(['groceries', 'other_food', 'other']);

// Human-readable category names
const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  coffee: 'Coffee & Cafes',
  dining: 'Restaurants',
  fast_food: 'Fast Food',
  nightlife: 'Nightlife',
  entertainment: 'Entertainment',
  fitness: 'Fitness',
};

function formatCategoryName(name: string): string {
  return CATEGORY_DISPLAY_NAMES[name.toLowerCase()] || name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface CategoryBreakdown {
  name: string;
  count: number;
  merchants: string[];
  color: string;
  emoji: string;
}

export default function EnhancedRevealScreen() {
  const { profile, fetchFusedProfile } = useTasteStore();
  const { user } = useAuthStore();
  const { dev_user } = useLocalSearchParams<{ dev_user?: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [categoryBreakdowns, setCategoryBreakdowns] = useState<CategoryBreakdown[]>([]);

  // Use dev user ID if provided (from "Use Cache" button), otherwise use logged-in user
  const effectiveUserId = dev_user || user?.id;

  useEffect(() => {
    const loadData = async () => {
      if (effectiveUserId) {
        try {
          console.log('[EnhancedReveal] Fetching data for:', effectiveUserId);

          // Fetch both fused and observed taste in parallel
          const [, observedTaste] = await Promise.all([
            fetchFusedProfile(effectiveUserId),
            tasteApi.getObserved(effectiveUserId).catch(() => null),
          ]);

          // Process observed taste for category breakdowns
          if (observedTaste?.categories) {
            const breakdowns: CategoryBreakdown[] = Object.entries(observedTaste.categories)
              .filter(([name]) => !HIDDEN_CATEGORIES.has(name.toLowerCase()))
              .map(([name, data]) => ({
                name: formatCategoryName(name),
                count: data.count,
                merchants: data.merchants || [],
                color: CATEGORY_COLORS[name.toLowerCase()] || CATEGORY_COLORS.default,
                emoji: CATEGORY_EMOJIS[name.toLowerCase()] || CATEGORY_EMOJIS.default,
              }))
              .filter((b) => b.count > 0)
              .sort((a, b) => b.count - a.count);

            setCategoryBreakdowns(breakdowns);
          }
        } catch (error) {
          console.error('[EnhancedReveal] Failed to fetch data:', error);
        }
      }

      // Show reveal animation after loading
      setIsLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    };

    loadData();
  }, [effectiveUserId]);

  const handleGetStarted = () => {
    router.push('/(onboarding)/location');
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
            Quiz + Transaction history
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.header}>
            <Typography variant="h2" color="primary" align="center">
              Your Taste Profile
            </Typography>
            <Typography variant="body" color="gold" align="center">
              ✨ Powered by real dining data
            </Typography>
          </View>

          {/* Taste Ring Card */}
          <Card variant="elevated" padding="lg" style={styles.ringCard}>
            <TasteRing size={140} showCard={false} onPress={() => {}} />
            <View style={styles.profileInfo}>
              <Typography variant="h3" color="primary" align="center">
                {profile.title}
              </Typography>
              <Typography variant="bodySmall" color="secondary" align="center">
                {profile.tagline}
              </Typography>
            </View>
          </Card>

          {/* Category Breakdowns */}
          {categoryBreakdowns.length > 0 && (
            <View style={styles.breakdownSection}>
              <Typography variant="h4" color="primary" style={styles.sectionTitle}>
                Your Top Categories
              </Typography>

              {categoryBreakdowns.slice(0, 5).map((category) => (
                <CategoryCard key={category.name} category={category} />
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Start Exploring" fullWidth onPress={handleGetStarted} />
      </View>
    </SafeAreaView>
  );
}

interface CategoryCardProps {
  category: CategoryBreakdown;
}

function CategoryCard({ category }: CategoryCardProps) {
  const displayMerchants = category.merchants.slice(0, 2);
  const remainingCount = Math.max(0, category.merchants.length - 2);

  return (
    <Card variant="default" padding="md" style={styles.categoryCard}>
      <View style={styles.categoryHeader}>
        <View style={styles.categoryTitleRow}>
          <Text style={styles.categoryEmoji}>{category.emoji}</Text>
          <Typography variant="h4" color="primary">
            {category.name}
          </Typography>
        </View>
        <View style={styles.countBadge}>
          <Typography variant="caption" style={styles.countText}>
            {category.count} visits
          </Typography>
        </View>
      </View>

      {displayMerchants.length > 0 && (
        <View style={styles.merchantList}>
          {displayMerchants.map((merchant, index) => (
            <View key={index} style={styles.merchantRow}>
              <View style={styles.merchantBullet} />
              <Typography variant="bodySmall" color="secondary" numberOfLines={1}>
                {merchant}
              </Typography>
            </View>
          ))}
          {remainingCount > 0 && (
            <Typography variant="caption" color="muted" style={styles.moreText}>
              +{remainingCount} more places
            </Typography>
          )}
        </View>
      )}
    </Card>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layoutSpacing.lg,
    paddingTop: layoutSpacing.lg,
    paddingBottom: layoutSpacing.md,
  },
  header: {
    marginBottom: layoutSpacing.lg,
    gap: layoutSpacing.xs,
  },
  ringCard: {
    alignItems: 'center',
    gap: layoutSpacing.md,
  },
  profileInfo: {
    gap: layoutSpacing.xs,
  },
  breakdownSection: {
    marginTop: layoutSpacing.lg,
    gap: layoutSpacing.sm,
  },
  sectionTitle: {
    marginBottom: layoutSpacing.xs,
  },
  categoryCard: {
    gap: layoutSpacing.sm,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.sm,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  countBadge: {
    backgroundColor: colors.dark.surfaceAlt,
    paddingHorizontal: layoutSpacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    color: colors.primary.DEFAULT,
    fontWeight: '600',
  },
  merchantList: {
    marginLeft: layoutSpacing.lg,
    gap: 4,
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.sm,
  },
  merchantBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.dark.border,
  },
  moreText: {
    marginTop: 4,
    marginLeft: layoutSpacing.sm,
  },
  footer: {
    paddingHorizontal: layoutSpacing.lg,
    paddingBottom: layoutSpacing.lg,
    paddingTop: layoutSpacing.sm,
  },
});
