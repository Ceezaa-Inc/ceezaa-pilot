import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { Button, Typography, OTPInput } from '@/components/ui';
import { useAuthStore } from '@/stores';

export default function VerifyScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(30);
  const { verifyOtp, sendOtp, isLoading, error, clearError } = useAuthStore();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (error) {
      Alert.alert('Verification Failed', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error]);

  useEffect(() => {
    // Auto-submit when OTP is complete
    if (otp.length === 6) {
      handleVerify();
    }
  }, [otp]);

  const handleVerify = async () => {
    if (otp.length !== 6 || !phone) return;

    const success = await verifyOtp(phone, otp);

    if (success) {
      // Navigate to onboarding quiz on successful verification
      router.replace('/(onboarding)/quiz');
    }
  };

  const handleResend = async () => {
    if (!phone) return;

    setCountdown(30);
    setOtp('');

    const success = await sendOtp(phone);
    if (success) {
      Alert.alert('Code Sent', 'A new verification code has been sent to your phone.');
    }
  };

  // Format phone for display
  const formatPhoneDisplay = (phoneNumber: string) => {
    if (!phoneNumber) return '';
    // Remove +1 and format
    const digits = phoneNumber.replace(/^\+1/, '');
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phoneNumber;
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
            We sent a 6-digit code to {formatPhoneDisplay(phone || '')}
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
            <TouchableOpacity onPress={handleResend} disabled={isLoading}>
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
