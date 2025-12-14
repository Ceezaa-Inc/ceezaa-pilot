import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography } from '@/components/ui';
import { Reaction, getReactionEmoji, getReactionLabel } from '@/mocks/visits';

const REACTIONS: Reaction[] = ['loved', 'good', 'meh', 'never_again'];

interface ReactionPickerProps {
  selected?: Reaction;
  onChange: (reaction: Reaction) => void;
  showLabels?: boolean;
}

export function ReactionPicker({ selected, onChange, showLabels = false }: ReactionPickerProps) {
  return (
    <View style={styles.container}>
      {REACTIONS.map((reaction) => (
        <TouchableOpacity
          key={reaction}
          style={[styles.option, selected === reaction && styles.optionSelected]}
          onPress={() => onChange(reaction)}
          activeOpacity={0.7}
        >
          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>{getReactionEmoji(reaction)}</Text>
          </View>
          {showLabels && (
            <Typography
              variant="caption"
              color={selected === reaction ? 'gold' : 'muted'}
              align="center"
            >
              {getReactionLabel(reaction)}
            </Typography>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: layoutSpacing.sm,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: layoutSpacing.md,
    paddingHorizontal: layoutSpacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.dark.surface,
    borderWidth: 1,
    borderColor: colors.dark.border,
    gap: layoutSpacing.xs,
  },
  optionSelected: {
    backgroundColor: colors.primary.muted,
    borderColor: colors.primary.DEFAULT,
  },
  emojiContainer: {
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 28,
    lineHeight: 36,
    textAlign: 'center',
  },
});

export default ReactionPicker;
