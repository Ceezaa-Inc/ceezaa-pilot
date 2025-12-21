import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { Typography, Button, Modal, OTPInput } from '@/components/ui';
import { useSessionStore, Session } from '@/stores/useSessionStore';
import { useAuthStore } from '@/stores/useAuthStore';

interface JoinSessionModalProps {
  visible: boolean;
  onClose: () => void;
  onJoinSuccess: (session: Session) => void;
}

export function JoinSessionModal({ visible, onClose, onJoinSuccess }: JoinSessionModalProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { joinSession } = useSessionStore();
  const { user } = useAuthStore();

  const handleJoin = async () => {
    if (code.length !== 6) {
      setError('Please enter a 6-character code');
      return;
    }

    if (!user?.id) {
      setError('Please sign in to join a session');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const session = await joinSession(code, user.id);

      if (session) {
        setCode('');
        onJoinSuccess(session);
        onClose();
      } else {
        setError('Invalid session code. Please check and try again.');
      }
    } catch (err) {
      setError('Failed to join session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCode('');
    setError(null);
    onClose();
  };

  return (
    <Modal visible={visible} onClose={handleClose} showCloseButton>
      <View style={styles.container}>
        <Typography variant="h3" color="primary" align="center">
          Join Session
        </Typography>
        <Typography variant="body" color="secondary" align="center" style={styles.subtitle}>
          Enter the 6-character code shared by your friend
        </Typography>

        <View style={styles.inputContainer}>
          <OTPInput
            length={6}
            value={code}
            onChange={(newCode) => {
              setCode(newCode.toUpperCase());
              setError(null);
            }}
          />
        </View>

        {error && (
          <Typography variant="caption" color="primary" align="center" style={styles.error}>
            {error}
          </Typography>
        )}

        <View style={styles.buttons}>
          <Button
            label={isLoading ? 'Joining...' : 'Join Session'}
            fullWidth
            onPress={handleJoin}
            disabled={code.length !== 6 || isLoading}
          />
          <Button label="Cancel" variant="ghost" fullWidth onPress={handleClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: layoutSpacing.md,
    paddingTop: layoutSpacing.md,
  },
  subtitle: {
    marginBottom: layoutSpacing.sm,
  },
  inputContainer: {
    alignItems: 'center',
  },
  error: {
    color: '#FF6B6B',
  },
  buttons: {
    gap: layoutSpacing.sm,
    marginTop: layoutSpacing.md,
  },
});
