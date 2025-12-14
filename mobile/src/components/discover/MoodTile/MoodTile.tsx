import React from 'react';
import { StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography } from '@/components/ui';
import { MoodType, MOOD_DATA } from '@/mocks/taste';

const { width } = Dimensions.get('window');
const TILE_SIZE = (width - layoutSpacing.lg * 2 - layoutSpacing.sm) / 2;

interface MoodTileProps {
  mood: MoodType;
  onPress?: () => void;
}

const MOOD_EMOJIS: Record<MoodType, string> = {
  chill: '😌',
  energetic: '⚡',
  romantic: '💕',
  social: '🎉',
  adventurous: '🌍',
  cozy: '🕯️',
};

export function MoodTile({ mood, onPress }: MoodTileProps) {
  const moodData = MOOD_DATA[mood];
  const emoji = MOOD_EMOJIS[mood];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={moodData.gradient as [string, string]}
        style={styles.tile}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Typography variant="h2" align="center">
          {emoji}
        </Typography>
        <Typography variant="bodySmall" color="primary" align="center">
          {moodData.label}
        </Typography>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: layoutSpacing.xs,
  },
});
