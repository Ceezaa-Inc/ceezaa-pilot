import React from 'react';
import {
  Modal as RNModal,
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors } from '@/design/tokens/colors';
import { borderRadius } from '@/design/tokens/borderRadius';
import { layoutSpacing } from '@/design/tokens/spacing';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  testID?: string;
}

export function Modal({
  visible,
  onClose,
  children,
  showCloseButton = false,
  closeOnBackdrop = true,
  testID,
}: ModalProps) {
  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      testID={testID}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.backdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <TouchableWithoutFeedback>
              <View style={styles.content}>
                {showCloseButton && (
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={onClose}
                    testID={`${testID}-close`}
                  >
                    <View style={styles.closeIcon}>
                      <View style={[styles.closeLine, styles.closeLine1]} />
                      <View style={[styles.closeLine, styles.closeLine2]} />
                    </View>
                  </TouchableOpacity>
                )}
                {children}
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: colors.dark.surface,
    borderRadius: borderRadius['2xl'],
    padding: layoutSpacing.lg,
    marginHorizontal: layoutSpacing.lg,
    maxWidth: 400,
    width: '90%',
  },
  closeButton: {
    position: 'absolute',
    top: layoutSpacing.md,
    right: layoutSpacing.md,
    zIndex: 1,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.dark.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeLine: {
    position: 'absolute',
    width: 14,
    height: 2,
    backgroundColor: colors.text.secondary,
    borderRadius: 1,
  },
  closeLine1: {
    transform: [{ rotate: '45deg' }],
  },
  closeLine2: {
    transform: [{ rotate: '-45deg' }],
  },
});

export default Modal;
