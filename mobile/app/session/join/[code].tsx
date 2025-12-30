import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { Typography, Button } from '@/components/ui';
import { useSessionStore } from '@/stores/useSessionStore';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * Deep link handler for joining sessions via code.
 * URLs: ceezaa://session/join/{code} or https://ceezaa.app/join/{code}
 *
 * - If authenticated: Attempts to join the session automatically
 * - If not authenticated: Redirects to auth, stores code for later
 */
export default function JoinSessionScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { user, isAuthenticated } = useAuthStore();
  const { joinSession } = useSessionStore();

  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!code) {
      setError('Invalid session code');
      return;
    }

    if (!isAuthenticated || !user?.id) {
      // Not authenticated - redirect to auth
      // TODO: Store code in AsyncStorage for post-auth join
      router.replace('/(auth)/welcome');
      return;
    }

    // Authenticated - attempt to join
    handleJoin();
  }, [code, isAuthenticated, user?.id]);

  const handleJoin = async () => {
    if (!code || !user?.id) return;

    setIsJoining(true);
    setError(null);

    try {
      const session = await joinSession(code.toUpperCase(), user.id);

      if (session) {
        setSuccess(true);
        // Short delay to show success, then navigate
        setTimeout(() => {
          router.replace({
            pathname: '/(tabs)/sessions/[id]',
            params: { id: session.id },
          });
        }, 500);
      } else {
        setError('Invalid session code. Please check and try again.');
      }
    } catch (err) {
      console.error('Failed to join session:', err);
      setError('Failed to join session. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleGoBack = () => {
    router.replace('/(tabs)/sessions');
  };

  const handleTryAgain = () => {
    setError(null);
    handleJoin();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {isJoining ? (
          <>
            <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
            <Typography variant="h3" color="primary" align="center" style={styles.title}>
              Joining Session...
            </Typography>
            <Typography variant="body" color="secondary" align="center">
              Code: {code?.toUpperCase()}
            </Typography>
          </>
        ) : success ? (
          <>
            <Typography variant="h1" align="center" style={styles.emoji}>
              🎉
            </Typography>
            <Typography variant="h3" color="primary" align="center" style={styles.title}>
              Joined Successfully!
            </Typography>
            <Typography variant="body" color="secondary" align="center">
              Redirecting to session...
            </Typography>
          </>
        ) : error ? (
          <>
            <Typography variant="h1" align="center" style={styles.emoji}>
              😕
            </Typography>
            <Typography variant="h3" color="primary" align="center" style={styles.title}>
              Couldn't Join
            </Typography>
            <Typography variant="body" color="secondary" align="center" style={styles.errorText}>
              {error}
            </Typography>
            <View style={styles.buttons}>
              <Button label="Try Again" onPress={handleTryAgain} fullWidth />
              <Button label="Go to Sessions" variant="ghost" onPress={handleGoBack} fullWidth />
            </View>
          </>
        ) : null}
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: layoutSpacing.xl,
    gap: layoutSpacing.md,
  },
  title: {
    marginTop: layoutSpacing.lg,
  },
  emoji: {
    fontSize: 64,
  },
  errorText: {
    marginTop: layoutSpacing.sm,
  },
  buttons: {
    width: '100%',
    gap: layoutSpacing.sm,
    marginTop: layoutSpacing.xl,
  },
});
