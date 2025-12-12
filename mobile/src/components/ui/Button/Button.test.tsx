import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button', () => {
  describe('rendering', () => {
    it('renders with label text', () => {
      render(<Button label="Get Started" onPress={() => {}} />);
      expect(screen.getByText('Get Started')).toBeTruthy();
    });

    it('renders children when provided instead of label', () => {
      render(
        <Button onPress={() => {}}>
          <></>
        </Button>
      );
      expect(screen.getByRole('button')).toBeTruthy();
    });
  });

  describe('variants', () => {
    it('renders primary variant by default', () => {
      render(<Button label="Primary" onPress={() => {}} />);
      const button = screen.getByRole('button');
      expect(button).toBeTruthy();
    });

    it('renders secondary variant', () => {
      render(<Button label="Secondary" variant="secondary" onPress={() => {}} />);
      expect(screen.getByText('Secondary')).toBeTruthy();
    });

    it('renders ghost variant', () => {
      render(<Button label="Ghost" variant="ghost" onPress={() => {}} />);
      expect(screen.getByText('Ghost')).toBeTruthy();
    });

    it('renders danger variant', () => {
      render(<Button label="Danger" variant="danger" onPress={() => {}} />);
      expect(screen.getByText('Danger')).toBeTruthy();
    });
  });

  describe('sizes', () => {
    it('renders medium size by default', () => {
      render(<Button label="Medium" onPress={() => {}} />);
      expect(screen.getByText('Medium')).toBeTruthy();
    });

    it('renders small size', () => {
      render(<Button label="Small" size="sm" onPress={() => {}} />);
      expect(screen.getByText('Small')).toBeTruthy();
    });

    it('renders large size', () => {
      render(<Button label="Large" size="lg" onPress={() => {}} />);
      expect(screen.getByText('Large')).toBeTruthy();
    });
  });

  describe('interactions', () => {
    it('calls onPress when pressed', () => {
      const onPressMock = jest.fn();
      render(<Button label="Press Me" onPress={onPressMock} />);

      fireEvent.press(screen.getByRole('button'));
      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when disabled', () => {
      const onPressMock = jest.fn();
      render(<Button label="Disabled" onPress={onPressMock} disabled />);

      fireEvent.press(screen.getByRole('button'));
      expect(onPressMock).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('shows loading indicator when loading', () => {
      render(<Button label="Loading" onPress={() => {}} loading />);
      expect(screen.getByTestId('button-loading')).toBeTruthy();
    });

    it('does not show label when loading', () => {
      render(<Button label="Loading" onPress={() => {}} loading />);
      expect(screen.queryByText('Loading')).toBeNull();
    });

    it('disables press when loading', () => {
      const onPressMock = jest.fn();
      render(<Button label="Loading" onPress={onPressMock} loading />);

      fireEvent.press(screen.getByRole('button'));
      expect(onPressMock).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has accessible role of button', () => {
      render(<Button label="Accessible" onPress={() => {}} />);
      expect(screen.getByRole('button')).toBeTruthy();
    });

    it('has accessible label', () => {
      render(<Button label="Accessible Button" onPress={() => {}} />);
      expect(screen.getByLabelText('Accessible Button')).toBeTruthy();
    });

    it('indicates disabled state accessibly', () => {
      render(<Button label="Disabled" onPress={() => {}} disabled />);
      const button = screen.getByRole('button');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('fullWidth', () => {
    it('renders full width when specified', () => {
      render(<Button label="Full Width" onPress={() => {}} fullWidth />);
      expect(screen.getByText('Full Width')).toBeTruthy();
    });
  });
});
