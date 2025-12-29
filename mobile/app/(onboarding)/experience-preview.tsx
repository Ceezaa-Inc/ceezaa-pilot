import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  ImageSourcePropType,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { Button, Typography } from '@/components/ui';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - layoutSpacing.lg * 2;

const EXPERIENCES = [
  {
    id: 1,
    name: "Joe's Bar",
    cuisine: 'Cocktail Bar',
    matchScore: 94,
    rating: 4.6,
    vibe: 'Energetic',
    vibeEmoji: '🔥',
    bestFor: ['Late Night', 'Friends'],
    aiReason: 'Matches your night owl energy',
    image: require('../../assets/experiences/joes.png'),
  },
  {
    id: 2,
    name: 'Bella Italia',
    cuisine: 'Italian',
    matchScore: 91,
    rating: 4.8,
    vibe: 'Romantic',
    vibeEmoji: '💕',
    bestFor: ['Date Night', 'Special Occasion'],
    aiReason: 'Perfect for your Italian cravings',
    image: require('../../assets/experiences/bella_italia.png'),
  },
  {
    id: 3,
    name: 'Sushi Roku',
    cuisine: 'Japanese',
    matchScore: 88,
    rating: 4.7,
    vibe: 'Adventurous',
    vibeEmoji: '🌍',
    bestFor: ['Trying New Things', 'Omakase'],
    aiReason: 'For your adventurous palate',
    image: require('../../assets/experiences/sushi.png'),
  },
];

export default function ExperiencePreviewScreen() {
  const handleContinue = () => {
    router.push('/(onboarding)/card-link');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Typography variant="h2" color="primary" align="center">
            Your Personalized Feed
          </Typography>
          <Typography variant="body" color="secondary" align="center" style={styles.subhead}>
            AI-curated spots based on your real dining history
          </Typography>
        </View>

        <View style={styles.cards}>
          {EXPERIENCES.map((experience) => (
            <ExperienceCard key={experience.id} {...experience} />
          ))}
        </View>

        <View style={styles.cta}>
          <Typography variant="bodySmall" color="muted" align="center">
            Link your card to unlock personalized recommendations
          </Typography>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Link Your Account" fullWidth onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
}

interface ExperienceCardProps {
  name: string;
  cuisine: string;
  matchScore: number;
  rating: number;
  vibe: string;
  vibeEmoji: string;
  bestFor: string[];
  aiReason: string;
  image: ImageSourcePropType;
}

function ExperienceCard({
  name,
  cuisine,
  matchScore,
  rating,
  vibe,
  vibeEmoji,
  bestFor,
  aiReason,
  image,
}: ExperienceCardProps) {
  return (
    <View style={styles.card}>
      {/* Image with gradient overlay */}
      <View style={styles.imageContainer}>
        <Image source={image} style={styles.cardImage} resizeMode="cover" />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.imageGradient}
        />
        {/* Match score badge */}
        <View style={styles.matchBadge}>
          <Typography variant="caption" style={styles.matchText}>
            {matchScore}% Match
          </Typography>
        </View>
        {/* Vibe badge */}
        <View style={styles.vibeBadge}>
          <Typography variant="caption" color="primary">
            {vibeEmoji} {vibe}
          </Typography>
        </View>
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <Typography variant="h4" color="primary">
              {name}
            </Typography>
            <View style={styles.ratingBadge}>
              <Typography variant="caption" color="primary">
                ★ {rating}
              </Typography>
            </View>
          </View>
          <Typography variant="bodySmall" color="secondary">
            {cuisine}
          </Typography>
        </View>

        {/* Best For tags */}
        <View style={styles.tagsRow}>
          {bestFor.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Typography variant="caption" color="secondary">
                {tag}
              </Typography>
            </View>
          ))}
        </View>

        {/* AI reason */}
        <View style={styles.aiReasonContainer}>
          <Typography variant="caption" color="gold">
            ✨ {aiReason}
          </Typography>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layoutSpacing.lg,
    paddingTop: layoutSpacing.lg,
    paddingBottom: layoutSpacing.lg,
  },
  header: {
    marginBottom: layoutSpacing.lg,
    gap: layoutSpacing.xs,
  },
  subhead: {
    marginTop: layoutSpacing.xs,
  },
  cards: {
    gap: layoutSpacing.md,
  },
  cta: {
    marginTop: layoutSpacing.lg,
    paddingHorizontal: layoutSpacing.md,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    backgroundColor: colors.dark.surface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  imageContainer: {
    position: 'relative',
    height: 140,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  matchBadge: {
    position: 'absolute',
    top: layoutSpacing.sm,
    right: layoutSpacing.sm,
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: layoutSpacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchText: {
    color: colors.dark.background,
    fontWeight: '700',
  },
  vibeBadge: {
    position: 'absolute',
    bottom: layoutSpacing.sm,
    left: layoutSpacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: layoutSpacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardContent: {
    padding: layoutSpacing.md,
    gap: layoutSpacing.sm,
  },
  cardHeader: {
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layoutSpacing.xs,
  },
  tag: {
    backgroundColor: colors.dark.surfaceAlt,
    paddingHorizontal: layoutSpacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  aiReasonContainer: {
    backgroundColor: colors.primary.muted,
    paddingHorizontal: layoutSpacing.sm,
    paddingVertical: layoutSpacing.xs,
    borderRadius: 8,
    marginTop: layoutSpacing.xs,
  },
  footer: {
    paddingHorizontal: layoutSpacing.lg,
    paddingBottom: layoutSpacing.lg,
    paddingTop: layoutSpacing.sm,
  },
});
