import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { Button, Input, Typography, Logo } from '@/components/ui';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!phone || phone.length < 10) return;

    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);

    router.push('/(auth)/verify');
  };

  const handleSocialLogin = (provider: string) => {
    // Mock social login - go straight to verify
    router.push('/(auth)/verify');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Typography variant="body" color="secondary">
            ← Back
          </Typography>
        </TouchableOpacity>

        <View style={styles.header}>
          <Logo variant="emblem" size={36} style={styles.logo} />
          <Typography variant="h2" color="primary">
            Welcome back
          </Typography>
          <Typography variant="body" color="secondary" style={styles.subtitle}>
            Enter your phone number to continue
          </Typography>
        </View>

        <View style={styles.form}>
          <Input
            label="Phone Number"
            placeholder="+1 (555) 000-0000"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoFocus
          />

          <Button
            label="Continue"
            fullWidth
            loading={isLoading}
            disabled={phone.length < 10}
            onPress={handleContinue}
          />
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Typography variant="caption" color="muted" style={styles.dividerText}>
            or continue with
          </Typography>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialButtons}>
          <Button
            label="Continue with Google"
            variant="secondary"
            fullWidth
            onPress={() => handleSocialLogin('google')}
          />
          <Button
            label="Continue with Apple"
            variant="secondary"
            fullWidth
            onPress={() => handleSocialLogin('apple')}
          />
        </View>
      </View>
    </SafeAreaView>
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
  },
  backButton: {
    paddingVertical: layoutSpacing.md,
  },
  header: {
    marginTop: layoutSpacing.xl,
    marginBottom: layoutSpacing.xl,
    alignItems: 'flex-start',
  },
  logo: {
    marginBottom: layoutSpacing.md,
  },
  subtitle: {
    marginTop: layoutSpacing.xs,
  },
  form: {
    gap: layoutSpacing.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: layoutSpacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.dark.border,
  },
  dividerText: {
    marginHorizontal: layoutSpacing.md,
  },
  socialButtons: {
    gap: layoutSpacing.sm,
  },
});
