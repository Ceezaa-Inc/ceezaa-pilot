import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Input } from './Input';

describe('Input', () => {
  describe('rendering', () => {
    it('renders with placeholder', () => {
      render(<Input placeholder="Enter email" />);
      expect(screen.getByPlaceholderText('Enter email')).toBeTruthy();
    });

    it('renders with label', () => {
      render(<Input label="Email" placeholder="Enter email" />);
      expect(screen.getByText('Email')).toBeTruthy();
    });

    it('renders with value', () => {
      render(<Input value="test@example.com" />);
      expect(screen.getByDisplayValue('test@example.com')).toBeTruthy();
    });
  });

  describe('error state', () => {
    it('displays error message', () => {
      render(<Input error="Invalid email" />);
      expect(screen.getByText('Invalid email')).toBeTruthy();
    });
  });

  describe('hint', () => {
    it('displays hint text', () => {
      render(<Input hint="We will never share your email" />);
      expect(screen.getByText('We will never share your email')).toBeTruthy();
    });

    it('shows error over hint when both provided', () => {
      render(<Input hint="Hint text" error="Error text" />);
      expect(screen.getByText('Error text')).toBeTruthy();
      expect(screen.queryByText('Hint text')).toBeNull();
    });
  });

  describe('icons', () => {
    it('renders left icon', () => {
      render(<Input leftIcon={<Text testID="left-icon">@</Text>} />);
      expect(screen.getByTestId('left-icon')).toBeTruthy();
    });

    it('renders right icon', () => {
      render(<Input rightIcon={<Text testID="right-icon">X</Text>} />);
      expect(screen.getByTestId('right-icon')).toBeTruthy();
    });

    it('calls onRightIconPress when right icon pressed', () => {
      const onPressMock = jest.fn();
      render(
        <Input
          rightIcon={<Text>X</Text>}
          onRightIconPress={onPressMock}
        />
      );
      fireEvent.press(screen.getByText('X'));
      expect(onPressMock).toHaveBeenCalled();
    });
  });

  describe('interactions', () => {
    it('calls onChangeText when text changes', () => {
      const onChangeMock = jest.fn();
      render(<Input onChangeText={onChangeMock} />);

      const input = screen.getByRole('none'); // TextInput doesn't have a specific role
      fireEvent.changeText(input, 'new text');
      expect(onChangeMock).toHaveBeenCalledWith('new text');
    });

    it('calls onFocus when focused', () => {
      const onFocusMock = jest.fn();
      render(<Input onFocus={onFocusMock} testID="input" />);

      fireEvent(screen.getByTestId('input'), 'focus');
      expect(onFocusMock).toHaveBeenCalled();
    });

    it('calls onBlur when blurred', () => {
      const onBlurMock = jest.fn();
      render(<Input onBlur={onBlurMock} testID="input" />);

      fireEvent(screen.getByTestId('input'), 'blur');
      expect(onBlurMock).toHaveBeenCalled();
    });
  });
});
