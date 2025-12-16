import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Keyboard, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { Button, Input, Typography, Logo } from '@/components/ui';
import { useAuthStore } from '@/stores';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const { sendOtp, devSignIn, isLoading, error, clearError } = useAuthStore();

  // DEV MODE: Quick sign-in for development
  const handleDevSignIn = () => {
    devSignIn();
    router.replace('/(onboarding)/quiz');
  };

  // Format phone for display but store raw
  const formatPhoneDisplay = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');

    // Format as US phone number
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (value: string) => {
    // Store only digits
    const digits = value.replace(/\D/g, '').slice(0, 10);
    setPhone(digits);
  };

  // Convert to E.164 format
  const getE164Phone = () => {
    return `+1${phone}`; // Assuming US numbers for now
  };

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error]);

  const handleContinue = async () => {
    if (phone.length < 10) return;

    const e164Phone = getE164Phone();
    const success = await sendOtp(e164Phone);

    if (success) {
      router.push({
        pathname: '/(auth)/verify',
        params: { phone: e164Phone },
      });
    }
  };

  const handleSocialLogin = (provider: 'google' | 'apple') => {
    // Social login requires native modules - will be implemented with expo-apple-authentication
    // and expo-auth-session for Google
    Alert.alert(
      'Coming Soon',
      `${provider === 'google' ? 'Google' : 'Apple'} Sign-in requires a development build. Use phone OTP for now in Expo Go.`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
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
                placeholder="(555) 000-0000"
                value={formatPhoneDisplay(phone)}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
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
              {__DEV__ && (
                <Button
                  label="🔧 DEV: Skip Auth"
                  variant="primary"
                  fullWidth
                  onPress={handleDevSignIn}
                />
              )}
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
        </ScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
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
    flexGrow: 1,
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
