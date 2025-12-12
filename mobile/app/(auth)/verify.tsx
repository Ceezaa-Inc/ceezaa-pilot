import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { Button, Typography, OTPInput } from '@/components/ui';

export default function VerifyScreen() {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    // Auto-submit when OTP is complete
    if (otp.length === 6) {
      handleVerify();
    }
  }, [otp]);

  const handleVerify = async () => {
    if (otp.length !== 6) return;

    setIsLoading(true);
    // Simulate verification
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);

    // Navigate to onboarding quiz
    router.replace('/(onboarding)/quiz');
  };

  const handleResend = () => {
    setCountdown(30);
    setOtp('');
    // Mock resend
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
          <Typography variant="h2" color="primary">
            Verify your number
          </Typography>
          <Typography variant="body" color="secondary" style={styles.subtitle}>
            We sent a 6-digit code to your phone
          </Typography>
        </View>

        <View style={styles.otpContainer}>
          <OTPInput value={otp} onChange={setOtp} testID="otp-input" />
        </View>

        <View style={styles.resendContainer}>
          {countdown > 0 ? (
            <Typography variant="bodySmall" color="muted">
              Resend code in {countdown}s
            </Typography>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Typography variant="bodySmall" color="gold">
                Resend code
              </Typography>
            </TouchableOpacity>
          )}
        </View>

        <Button
          label="Verify"
          fullWidth
          loading={isLoading}
          disabled={otp.length !== 6}
          onPress={handleVerify}
        />
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
    marginBottom: layoutSpacing['2xl'],
  },
  subtitle: {
    marginTop: layoutSpacing.xs,
  },
  otpContainer: {
    marginBottom: layoutSpacing.lg,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: layoutSpacing.xl,
  },
});
