import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Card, Button } from '@/components/ui';

const DATA_SECTIONS = [
  {
    title: 'Transaction Data',
    description: 'Dining transaction history from linked cards',
    icon: '💳',
  },
  {
    title: 'Taste Profile',
    description: 'Your preferences and dining style analysis',
    icon: '🎯',
  },
  {
    title: 'Visit History',
    description: 'Places you\'ve been and your reactions',
    icon: '📍',
  },
  {
    title: 'Session Data',
    description: 'Group planning sessions and voting history',
    icon: '👥',
  },
];

export default function PrivacyScreen() {
  const handleExportData = () => {
    Alert.alert(
      'Export Your Data',
      'We\'ll prepare a download of all your data. This may take a few minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            Alert.alert('Request Sent', 'You\'ll receive an email when your data is ready.');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'Are you absolutely sure? All your data will be permanently deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: () => {},
                },
              ]
            );
          },
        },
      ]
    );
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
            Privacy & Data
          </Typography>
          <Typography variant="body" color="secondary">
            You control your data. Always.
          </Typography>
        </View>

        {/* What We Store */}
        <View style={styles.section}>
          <Typography variant="label" color="muted" style={styles.sectionLabel}>
            What We Store
          </Typography>
          <View style={styles.dataList}>
            {DATA_SECTIONS.map((section, index) => (
              <Card key={index} variant="default" padding="md">
                <View style={styles.dataRow}>
                  <View style={styles.dataIcon}>
                    <Typography variant="body">{section.icon}</Typography>
                  </View>
                  <View style={styles.dataInfo}>
                    <Typography variant="body" color="primary">
                      {section.title}
                    </Typography>
                    <Typography variant="caption" color="muted">
                      {section.description}
                    </Typography>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        </View>

        {/* Data Controls */}
        <View style={styles.section}>
          <Typography variant="label" color="muted" style={styles.sectionLabel}>
            Data Controls
          </Typography>

          <Card variant="outlined" padding="lg" style={styles.controlCard}>
            <Typography variant="h4" color="primary">
              Export Your Data
            </Typography>
            <Typography variant="bodySmall" color="secondary" style={styles.controlDescription}>
              Download a copy of all your data in JSON format
            </Typography>
            <Button label="Request Export" variant="secondary" onPress={handleExportData} />
          </Card>

          <Card variant="outlined" padding="lg" style={[styles.controlCard, styles.dangerCard]}>
            <Typography variant="h4" color="error">
              Delete Account
            </Typography>
            <Typography variant="bodySmall" color="secondary" style={styles.controlDescription}>
              Permanently delete your account and all associated data
            </Typography>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
              <Typography variant="body" color="error">
                Delete My Account
              </Typography>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Privacy Policy Link */}
        <TouchableOpacity style={styles.policyLink}>
          <Typography variant="bodySmall" color="gold" align="center">
            View Full Privacy Policy →
          </Typography>
        </TouchableOpacity>
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
  section: {
    gap: layoutSpacing.sm,
  },
  sectionLabel: {
    marginBottom: layoutSpacing.xs,
  },
  dataList: {
    gap: layoutSpacing.sm,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.md,
  },
  dataIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.dark.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dataInfo: {
    flex: 1,
    gap: 2,
  },
  controlCard: {
    gap: layoutSpacing.sm,
  },
  controlDescription: {
    marginBottom: layoutSpacing.xs,
  },
  dangerCard: {
    borderColor: colors.error,
  },
  deleteButton: {
    paddingVertical: layoutSpacing.sm,
    paddingHorizontal: layoutSpacing.md,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  policyLink: {
    paddingVertical: layoutSpacing.md,
  },
});
