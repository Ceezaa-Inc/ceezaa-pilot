import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { OTPInput } from './OTPInput';

describe('OTPInput', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('rendering', () => {
    it('renders 6 inputs by default', () => {
      render(<OTPInput value="" onChange={mockOnChange} testID="otp" />);
      expect(screen.getByTestId('otp-input-0')).toBeTruthy();
      expect(screen.getByTestId('otp-input-5')).toBeTruthy();
    });

    it('renders custom length', () => {
      render(<OTPInput value="" onChange={mockOnChange} length={4} testID="otp" />);
      expect(screen.getByTestId('otp-input-0')).toBeTruthy();
      expect(screen.getByTestId('otp-input-3')).toBeTruthy();
      expect(screen.queryByTestId('otp-input-4')).toBeNull();
    });
  });

  describe('interactions', () => {
    it('calls onChange when typing', () => {
      render(<OTPInput value="" onChange={mockOnChange} testID="otp" />);
      const firstInput = screen.getByTestId('otp-input-0');
      fireEvent.changeText(firstInput, '1');
      expect(mockOnChange).toHaveBeenCalledWith('1');
    });

    it('displays provided value', () => {
      render(<OTPInput value="123456" onChange={mockOnChange} testID="otp" />);
      expect(screen.getByDisplayValue('1')).toBeTruthy();
      expect(screen.getByDisplayValue('6')).toBeTruthy();
    });
  });
});
