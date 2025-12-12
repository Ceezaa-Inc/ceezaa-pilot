import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Modal } from './Modal';

describe('Modal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  describe('rendering', () => {
    it('renders children when visible', () => {
      render(
        <Modal visible onClose={mockOnClose}>
          <Text>Modal Content</Text>
        </Modal>
      );
      expect(screen.getByText('Modal Content')).toBeTruthy();
    });

    it('does not render when not visible', () => {
      render(
        <Modal visible={false} onClose={mockOnClose}>
          <Text>Modal Content</Text>
        </Modal>
      );
      expect(screen.queryByText('Modal Content')).toBeNull();
    });
  });

  describe('close button', () => {
    it('renders close button when showCloseButton is true', () => {
      render(
        <Modal visible onClose={mockOnClose} showCloseButton testID="modal">
          <Text>Content</Text>
        </Modal>
      );
      expect(screen.getByTestId('modal-close')).toBeTruthy();
    });

    it('calls onClose when close button pressed', () => {
      render(
        <Modal visible onClose={mockOnClose} showCloseButton testID="modal">
          <Text>Content</Text>
        </Modal>
      );
      fireEvent.press(screen.getByTestId('modal-close'));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
