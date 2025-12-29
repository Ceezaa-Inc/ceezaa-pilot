import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { Button, Typography, LoadingSpinner } from '@/components/ui';
import { useLocationStore } from '@/stores';

export default function LocationScreen() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const { requestPermission, getCurrentLocation, seedVenues } = useLocationStore();

  const handleEnableLocation = async () => {
    setIsProcessing(true);

    try {
      // Step 1: Request permission
      setStatusMessage('Requesting permission...');
      const granted = await requestPermission();

      if (!granted) {
        setStatusMessage('');
        setIsProcessing(false);
        // Still navigate to app, just without location-based features
        router.replace('/(tabs)/pulse');
        return;
      }

      // Step 2: Get current location
      setStatusMessage('Getting your location...');
      const gotLocation = await getCurrentLocation();

      if (!gotLocation) {
        setStatusMessage('');
        setIsProcessing(false);
        router.replace('/(tabs)/pulse');
        return;
      }

      // Step 3: Seed nearby venues
      setStatusMessage('Finding nearby places...');
      await seedVenues();

      // Done - navigate to main app
      setStatusMessage('');
      setIsProcessing(false);
      router.replace('/(tabs)/pulse');
    } catch (error) {
      console.error('[Location] Enable flow failed:', error);
      setIsProcessing(false);
      setStatusMessage('');
      router.replace('/(tabs)/pulse');
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)/pulse');
  };

  if (isProcessing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Typography variant="h3" color="primary" align="center" style={styles.loadingText}>
            {statusMessage}
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📍</Text>
        </View>

        <View style={styles.textContainer}>
          <Typography variant="h2" color="primary" align="center">
            Discover nearby places
          </Typography>
          <Typography variant="body" color="secondary" align="center" style={styles.description}>
            Enable location to find the best spots around you, personalized to your taste.
          </Typography>
        </View>
      </View>

      <View style={styles.footer}>
        <Button label="Enable Location" fullWidth onPress={handleEnableLocation} />
        <Button label="Skip for now" variant="ghost" fullWidth onPress={handleSkip} />
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
    paddingHorizontal: layoutSpacing.xl,
  },
  loadingText: {
    marginTop: layoutSpacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: layoutSpacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: layoutSpacing.xl,
  },
  icon: {
    fontSize: 56,
    textAlign: 'center',
  },
  textContainer: {
    gap: layoutSpacing.md,
  },
  description: {
    marginTop: layoutSpacing.sm,
  },
  footer: {
    paddingHorizontal: layoutSpacing.lg,
    paddingBottom: layoutSpacing.lg,
    gap: layoutSpacing.sm,
  },
});
