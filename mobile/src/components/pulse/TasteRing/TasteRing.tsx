import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle, G } from 'react-native-svg';
import { MotiView } from 'moti';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { shadows } from '@/design/tokens/shadows';
import { Typography, Card } from '@/components/ui';
import { useTasteStore } from '@/stores';

interface TasteRingProps {
  size?: number;
  showCard?: boolean;
  onPress?: () => void;
}

export function TasteRing({ size = 200, showCard = true, onPress }: TasteRingProps) {
  const { categories, profile } = useTasteStore();

  // Determine article (a/an) based on title
  const getArticle = (title: string) => {
    if (!title) return 'a';
    const firstLetter = title.charAt(0).toLowerCase();
    return ['a', 'e', 'i', 'o', 'u'].includes(firstLetter) ? 'an' : 'a';
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/(tabs)/pulse/taste-detail');
    }
  };

  // SVG circle calculations
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Calculate total score for proportional segments
  const totalScore = categories.reduce((sum, cat) => sum + cat.score, 0);

  // Build segment data with offsets
  let currentOffset = 0;
  const segments = categories.map((category) => {
    const segmentLength = (category.score / totalScore) * circumference;
    const segment = {
      color: category.color,
      length: segmentLength,
      offset: currentOffset,
      gap: 4, // Small gap between segments
    };
    currentOffset += segmentLength;
    return segment;
  });

  const ringContent = (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
      <View style={styles.tasteRing}>
        {/* Animated glow effect */}
        <MotiView
          from={{ opacity: 0.4, scale: 0.98 }}
          animate={{ opacity: 0.8, scale: 1.02 }}
          transition={{
            type: 'timing',
            duration: 2000,
            loop: true,
          }}
          style={[styles.glowContainer, { width: size + 20, height: size + 20 }]}
        >
          <View
            style={[
              styles.glow,
              {
                width: size + 10,
                height: size + 10,
                borderRadius: (size + 10) / 2,
              },
            ]}
          />
        </MotiView>

        {/* SVG Ring with segments */}
        <Svg width={size} height={size} style={styles.svgRing}>
          <G rotation="-90" origin={`${center}, ${center}`}>
            {/* Background ring */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={colors.dark.surface}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Category segments */}
            {segments.map((segment, index) => (
              <Circle
                key={categories[index].name}
                cx={center}
                cy={center}
                r={radius}
                stroke={segment.color}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={`${segment.length - segment.gap} ${circumference - segment.length + segment.gap}`}
                strokeDashoffset={-segment.offset}
                strokeLinecap="round"
              />
            ))}
          </G>
        </Svg>

        {/* Center content */}
        <View style={[styles.centerContent, { width: size, height: size }]}>
          <Typography variant="caption" color="muted">
            You are {getArticle(profile.title)}
          </Typography>
          <Typography variant="body" color="gold" align="center" style={styles.archetypeText}>
            {profile.title}
          </Typography>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!showCard) {
    return ringContent;
  }

  return (
    <Card variant="elevated" padding="lg" style={styles.card}>
      {ringContent}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: layoutSpacing.md,
  },
  tasteRing: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    backgroundColor: colors.primary.DEFAULT,
    opacity: 0.15,
    ...shadows.lg,
  },
  svgRing: {
    zIndex: 1,
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  archetypeText: {
    maxWidth: 140,
    fontWeight: '600',
  },
});
