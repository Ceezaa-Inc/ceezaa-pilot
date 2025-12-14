import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Card, Button } from '@/components/ui';

const LINKED_CARDS = [
  {
    id: '1',
    type: 'Visa',
    last4: '4242',
    bank: 'Chase Sapphire',
    transactionCount: 42,
    linkedDate: '2024-11-15',
  },
];

export default function LinkedCardsScreen() {
  const handleAddCard = () => {
    Alert.alert('Coming Soon', 'Plaid integration will be available in a future update.');
  };

  const handleRemoveCard = (cardId: string) => {
    Alert.alert('Remove Card', 'Are you sure you want to remove this card?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {} },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Typography variant="body" color="primary">
              ← Back
            </Typography>
          </TouchableOpacity>
          <Typography variant="h2" color="primary">
            Linked Cards
          </Typography>
          <Typography variant="body" color="secondary">
            Connect your cards to track dining expenses automatically
          </Typography>
        </View>

        {/* Cards List */}
        <View style={styles.cardsList}>
          {LINKED_CARDS.map((card) => (
            <Card key={card.id} variant="default" padding="lg" style={styles.cardItem}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Typography variant="h3">💳</Typography>
                </View>
                <View style={styles.cardInfo}>
                  <Typography variant="h4" color="primary">
                    {card.bank}
                  </Typography>
                  <Typography variant="bodySmall" color="secondary">
                    {card.type} •••• {card.last4}
                  </Typography>
                </View>
              </View>
              <View style={styles.cardStats}>
                <View style={styles.cardStat}>
                  <Typography variant="h4" color="gold">
                    {card.transactionCount}
                  </Typography>
                  <Typography variant="caption" color="muted">
                    Transactions
                  </Typography>
                </View>
                <View style={styles.cardStat}>
                  <Typography variant="bodySmall" color="muted">
                    Linked on
                  </Typography>
                  <Typography variant="bodySmall" color="secondary">
                    {new Date(card.linkedDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Typography>
                </View>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveCard(card.id)}
              >
                <Typography variant="bodySmall" color="error">
                  Remove Card
                </Typography>
              </TouchableOpacity>
            </Card>
          ))}
        </View>

        {/* Add Card Button */}
        <Button label="+ Add New Card" fullWidth onPress={handleAddCard} />

        {/* Info Section */}
        <Card variant="outlined" padding="md" style={styles.infoCard}>
          <Typography variant="bodySmall" color="secondary">
            Your card data is securely processed through Plaid. We only access transaction
            information for dining establishments - never your full card number or account balance.
          </Typography>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  content: {
    padding: layoutSpacing.lg,
    gap: layoutSpacing.lg,
  },
  header: {
    gap: layoutSpacing.sm,
  },
  backButton: {
    marginBottom: layoutSpacing.xs,
  },
  cardsList: {
    gap: layoutSpacing.md,
  },
  cardItem: {
    gap: layoutSpacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.md,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.dark.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: layoutSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
  cardStat: {
    gap: 2,
  },
  removeButton: {
    alignSelf: 'flex-start',
    paddingVertical: layoutSpacing.xs,
  },
  infoCard: {
    backgroundColor: colors.dark.surfaceAlt,
  },
});
