import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Button, Typography, Card } from '@/components/ui';

const { width } = Dimensions.get('window');

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "What's your ideal Friday night?",
    options: [
      { id: 'a', text: 'Cozy dinner at a quiet spot', emoji: '🕯️' },
      { id: 'b', text: 'Lively bar with friends', emoji: '🍻' },
      { id: 'c', text: 'Trying a new trendy restaurant', emoji: '✨' },
      { id: 'd', text: 'Cooking at home', emoji: '👨‍🍳' },
    ],
  },
  {
    id: 2,
    question: 'How adventurous are you with food?',
    options: [
      { id: 'a', text: 'I stick to what I know', emoji: '🏠' },
      { id: 'b', text: 'Open to suggestions', emoji: '🤔' },
      { id: 'c', text: 'Love trying new things', emoji: '🌍' },
      { id: 'd', text: 'The weirder, the better', emoji: '🦑' },
    ],
  },
  {
    id: 3,
    question: 'Pick your vibe:',
    options: [
      { id: 'a', text: 'Upscale & elegant', emoji: '🥂' },
      { id: 'b', text: 'Casual & relaxed', emoji: '😌' },
      { id: 'c', text: 'Energetic & fun', emoji: '🎉' },
      { id: 'd', text: 'Intimate & romantic', emoji: '💕' },
    ],
  },
  {
    id: 4,
    question: 'Your go-to cuisine?',
    options: [
      { id: 'a', text: 'Italian', emoji: '🍝' },
      { id: 'b', text: 'Asian fusion', emoji: '🍜' },
      { id: 'c', text: 'American comfort', emoji: '🍔' },
      { id: 'd', text: 'Mediterranean', emoji: '🥗' },
    ],
  },
  {
    id: 5,
    question: 'Budget for a nice dinner?',
    options: [
      { id: 'a', text: 'Under $30', emoji: '💵' },
      { id: 'b', text: '$30-60', emoji: '💳' },
      { id: 'c', text: '$60-100', emoji: '💰' },
      { id: 'd', text: 'Sky\'s the limit', emoji: '💎' },
    ],
  },
];

export default function QuizScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const currentQuestion = QUIZ_QUESTIONS[currentIndex];
  const progress = (currentIndex + 1) / QUIZ_QUESTIONS.length;

  const handleSelect = (optionId: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: optionId });

    if (currentIndex < QUIZ_QUESTIONS.length - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 300);
    } else {
      // Quiz complete, go to taste card
      setTimeout(() => router.push('/(onboarding)/initial-taste'), 500);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {currentIndex > 0 ? (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Typography variant="body" color="secondary">
              ← Back
            </Typography>
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}
        <Typography variant="caption" color="muted">
          Question {currentIndex + 1} of {QUIZ_QUESTIONS.length}
        </Typography>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <View style={styles.content}>
        <Typography variant="h2" color="primary" align="center">
          {currentQuestion.question}
        </Typography>

        <View style={styles.options}>
          {currentQuestion.options.map((option) => (
            <QuizOption
              key={option.id}
              emoji={option.emoji}
              text={option.text}
              selected={answers[currentQuestion.id] === option.id}
              onPress={() => handleSelect(option.id)}
            />
          ))}
        </View>
      </View>

    </SafeAreaView>
  );
}

function QuizOption({
  emoji,
  text,
  selected,
  onPress,
}: {
  emoji: string;
  text: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Card
      variant={selected ? 'elevated' : 'outlined'}
      padding="md"
      style={[styles.option, selected && styles.optionSelected]}
    >
      <Button
        variant="ghost"
        fullWidth
        onPress={onPress}
      >
        <View style={styles.optionContent}>
          <Typography variant="h3" align="center">
            {emoji}
          </Typography>
          <Typography
            variant="body"
            color={selected ? 'gold' : 'primary'}
            align="center"
          >
            {text}
          </Typography>
        </View>
      </Button>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  header: {
    paddingHorizontal: layoutSpacing.lg,
    paddingTop: layoutSpacing.md,
    gap: layoutSpacing.sm,
  },
  backButton: {
    paddingVertical: layoutSpacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.dark.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: layoutSpacing.lg,
    paddingTop: layoutSpacing['2xl'],
    gap: layoutSpacing.xl,
  },
  options: {
    gap: layoutSpacing.sm,
  },
  option: {
    borderColor: colors.dark.border,
  },
  optionSelected: {
    borderColor: colors.primary.DEFAULT,
    backgroundColor: colors.primary.muted,
  },
  optionContent: {
    alignItems: 'center',
    gap: layoutSpacing.xs,
    paddingVertical: layoutSpacing.sm,
  },
});
