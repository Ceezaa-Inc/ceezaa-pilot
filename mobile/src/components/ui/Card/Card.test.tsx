import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from './Card';

describe('Card', () => {
  describe('rendering', () => {
    it('renders children', () => {
      render(
        <Card>
          <Text>Card Content</Text>
        </Card>
      );
      expect(screen.getByText('Card Content')).toBeTruthy();
    });

    it('renders with testID', () => {
      render(
        <Card testID="test-card">
          <Text>Content</Text>
        </Card>
      );
      expect(screen.getByTestId('test-card')).toBeTruthy();
    });
  });

  describe('variants', () => {
    it('renders default variant', () => {
      render(
        <Card variant="default" testID="card">
          <Text>Default</Text>
        </Card>
      );
      expect(screen.getByTestId('card')).toBeTruthy();
    });

    it('renders elevated variant', () => {
      render(
        <Card variant="elevated" testID="card">
          <Text>Elevated</Text>
        </Card>
      );
      expect(screen.getByTestId('card')).toBeTruthy();
    });

    it('renders outlined variant', () => {
      render(
        <Card variant="outlined" testID="card">
          <Text>Outlined</Text>
        </Card>
      );
      expect(screen.getByTestId('card')).toBeTruthy();
    });

    it('renders trust variant', () => {
      render(
        <Card variant="trust" testID="card">
          <Text>Trust</Text>
        </Card>
      );
      expect(screen.getByTestId('card')).toBeTruthy();
    });
  });

  describe('padding', () => {
    it('renders with no padding', () => {
      render(
        <Card padding="none" testID="card">
          <Text>No Padding</Text>
        </Card>
      );
      expect(screen.getByTestId('card')).toBeTruthy();
    });

    it('renders with large padding', () => {
      render(
        <Card padding="lg" testID="card">
          <Text>Large Padding</Text>
        </Card>
      );
      expect(screen.getByTestId('card')).toBeTruthy();
    });
  });
});
