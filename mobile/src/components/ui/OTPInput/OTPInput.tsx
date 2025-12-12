import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { colors } from '@/design/tokens/colors';
import { borderRadius } from '@/design/tokens/borderRadius';
import { typography } from '@/design/tokens/typography';

export interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  testID?: string;
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  autoFocus = true,
  testID,
}: OTPInputProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(autoFocus ? 0 : null);

  const handleChange = (text: string, index: number) => {
    const newValue = value.split('');

    // Handle paste (multiple characters)
    if (text.length > 1) {
      const pastedValue = text.slice(0, length);
      onChange(pastedValue);
      const nextIndex = Math.min(pastedValue.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    // Handle single character
    newValue[index] = text;
    const newOtp = newValue.join('').slice(0, length);
    onChange(newOtp);

    // Move to next input
    if (text && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handleBlur = () => {
    setFocusedIndex(null);
  };

  return (
    <View style={styles.container} testID={testID}>
      {Array.from({ length }).map((_, index) => (
        <TextInput
          key={index}
          ref={(ref) => (inputRefs.current[index] = ref)}
          style={[
            styles.input,
            focusedIndex === index && styles.inputFocused,
            value[index] && styles.inputFilled,
          ]}
          value={value[index] || ''}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          onFocus={() => handleFocus(index)}
          onBlur={handleBlur}
          keyboardType="number-pad"
          maxLength={index === 0 ? length : 1}
          autoFocus={autoFocus && index === 0}
          selectionColor={colors.primary.DEFAULT}
          testID={`${testID}-input-${index}`}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  input: {
    width: 48,
    height: 56,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.dark.border,
    backgroundColor: colors.dark.surfaceAlt,
    textAlign: 'center',
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.text.primary,
  },
  inputFocused: {
    borderColor: colors.primary.DEFAULT,
  },
  inputFilled: {
    borderColor: colors.primary.DEFAULT,
    backgroundColor: colors.primary.muted,
  },
});

export default OTPInput;
