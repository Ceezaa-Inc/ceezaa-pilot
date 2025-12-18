import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { Button, Typography, Logo } from '@/components/ui';
import { useAuthStore } from '@/stores';

export default function WelcomeScreen() {
  const { devSignIn } = useAuthStore();

  const handleGetStarted = () => {
    router.push('/(auth)/login');
  };

  // DEV ONLY: Skip to home (signs in as dev user first)
  const handleSkipToHome = () => {
    devSignIn();
    router.replace('/(tabs)/pulse');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Logo variant="full" size={36} />
          </View>
          <Typography variant="body" color="secondary" align="center" style={styles.tagline}>
            Your taste, intelligently understood
          </Typography>
        </View>

        <View style={styles.features}>
          <FeatureItem
            title="Discover Your Taste"
            description="Quick quiz reveals your dining DNA"
          />
          <FeatureItem
            title="Smart Recommendations"
            description="AI-powered venue matching"
          />
          <FeatureItem
            title="Group Decisions Made Easy"
            description="Real-time voting for group outings"
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Button label="Get Started" fullWidth onPress={handleGetStarted} />
        <Button
          label="Skip to Home (DEV)"
          variant="ghost"
          size="sm"
          fullWidth
          onPress={handleSkipToHome}
        />
        <Typography variant="caption" color="muted" align="center" style={styles.terms}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Typography>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.feature}>
      <View style={styles.featureDot} />
      <View style={styles.featureText}>
        <Typography variant="h4" color="primary">
          {title}
        </Typography>
        <Typography variant="bodySmall" color="secondary">
          {description}
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: layoutSpacing.lg,
    justifyContent: 'center',
  },
  header: {
    marginBottom: layoutSpacing['2xl'],
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagline: {
    marginTop: layoutSpacing.sm,
  },
  features: {
    gap: layoutSpacing.lg,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: layoutSpacing.md,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary.DEFAULT,
    marginTop: 8,
  },
  featureText: {
    flex: 1,
    gap: 4,
  },
  footer: {
    paddingHorizontal: layoutSpacing.lg,
    paddingBottom: layoutSpacing.lg,
    gap: layoutSpacing.md,
  },
  terms: {
    marginTop: layoutSpacing.sm,
  },
});
