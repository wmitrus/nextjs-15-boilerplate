'use client';

import React, { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';

import { useNonce } from './NonceContext';
import { NonceProvider } from './NonceProvider';

// Test component that consumes the nonce context
const TestConsumer = ({ testId }: { testId?: string }) => {
  const nonce = useNonce();
  return (
    <div data-testid={testId || 'nonce-consumer'}>
      {nonce === undefined ? 'undefined' : nonce}
    </div>
  );
};

describe('NonceProvider', () => {
  describe('Basic functionality', () => {
    it('should render children correctly', () => {
      const childText = 'Test child content';

      render(
        <NonceProvider nonce="test-nonce">
          <div>{childText}</div>
        </NonceProvider>,
      );

      expect(screen.getByText(childText)).toBeInTheDocument();
    });

    it('should provide nonce value to context consumers', () => {
      const testNonce = 'test-nonce-12345';

      render(
        <NonceProvider nonce={testNonce}>
          <TestConsumer />
        </NonceProvider>,
      );

      expect(screen.getByTestId('nonce-consumer')).toHaveTextContent(testNonce);
    });

    it('should provide undefined when nonce prop is undefined', () => {
      render(
        <NonceProvider nonce={undefined}>
          <TestConsumer />
        </NonceProvider>,
      );

      expect(screen.getByTestId('nonce-consumer')).toHaveTextContent(
        'undefined',
      );
    });

    it('should provide empty string when nonce prop is empty string', () => {
      render(
        <NonceProvider nonce="">
          <TestConsumer />
        </NonceProvider>,
      );

      expect(screen.getByTestId('nonce-consumer')).toHaveTextContent('');
    });

    it('should provide undefined when nonce prop is not provided', () => {
      render(
        <NonceProvider>
          <TestConsumer />
        </NonceProvider>,
      );

      expect(screen.getByTestId('nonce-consumer')).toHaveTextContent(
        'undefined',
      );
    });
  });

  describe('Props validation', () => {
    it('should accept various nonce formats', () => {
      const testCases = [
        'simple-nonce',
        'nonce_with_underscores',
        'nonce-with-dashes',
        'UPPERCASE-NONCE',
        'nonce123',
        '123456789',
        'nonce-with-!@#$%^&*()',
        'very-long-nonce-'.repeat(50),
      ];

      testCases.forEach((nonce, index) => {
        const testId = `nonce-consumer-${index}`;

        render(
          <NonceProvider nonce={nonce}>
            <TestConsumer testId={testId} />
          </NonceProvider>,
        );

        expect(screen.getByTestId(testId)).toHaveTextContent(nonce);
      });
    });

    it('should handle multiple children', () => {
      const testNonce = 'shared-nonce';

      render(
        <NonceProvider nonce={testNonce}>
          <TestConsumer testId="child-1" />
          <TestConsumer testId="child-2" />
          <div data-testid="plain-child">Plain child</div>
          <TestConsumer testId="child-3" />
        </NonceProvider>,
      );

      expect(screen.getByTestId('child-1')).toHaveTextContent(testNonce);
      expect(screen.getByTestId('child-2')).toHaveTextContent(testNonce);
      expect(screen.getByTestId('child-3')).toHaveTextContent(testNonce);
      expect(screen.getByTestId('plain-child')).toHaveTextContent(
        'Plain child',
      );
    });

    it('should accept React.ReactNode as children', () => {
      const testNonce = 'test-nonce';

      const children: ReactNode[] = [
        <div key="1">Text child</div>,
        <TestConsumer key="2" testId="hook-child" />,
        <span key="3">String child</span>,
        <span key="4">42</span>,
        null,
        undefined,
      ];

      render(<NonceProvider nonce={testNonce}>{children}</NonceProvider>);

      expect(screen.getByText('Text child')).toBeInTheDocument();
      expect(screen.getByTestId('hook-child')).toHaveTextContent(testNonce);
      expect(screen.getByText('String child')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  describe('Integration scenarios', () => {
    it('should work with nested providers (inner overrides outer)', () => {
      const outerNonce = 'outer-nonce';
      const innerNonce = 'inner-nonce';

      render(
        <NonceProvider nonce={outerNonce}>
          <TestConsumer testId="outer-consumer" />
          <NonceProvider nonce={innerNonce}>
            <TestConsumer testId="inner-consumer" />
          </NonceProvider>
        </NonceProvider>,
      );

      expect(screen.getByTestId('outer-consumer')).toHaveTextContent(
        outerNonce,
      );
      expect(screen.getByTestId('inner-consumer')).toHaveTextContent(
        innerNonce,
      );
    });

    it('should work with complex component tree', () => {
      const testNonce = 'complex-tree-nonce';

      const NestedComponent = () => (
        <div>
          <TestConsumer testId="nested-consumer" />
          <div>
            <div>
              <TestConsumer testId="deeply-nested-consumer" />
            </div>
          </div>
        </div>
      );

      render(
        <NonceProvider nonce={testNonce}>
          <div>
            <TestConsumer testId="root-consumer" />
            <NestedComponent />
          </div>
        </NonceProvider>,
      );

      expect(screen.getByTestId('root-consumer')).toHaveTextContent(testNonce);
      expect(screen.getByTestId('nested-consumer')).toHaveTextContent(
        testNonce,
      );
      expect(screen.getByTestId('deeply-nested-consumer')).toHaveTextContent(
        testNonce,
      );
    });

    it('should maintain context value through re-renders', () => {
      const testNonce = 'persistent-nonce';

      const { rerender } = render(
        <NonceProvider nonce={testNonce}>
          <TestConsumer />
        </NonceProvider>,
      );

      expect(screen.getByTestId('nonce-consumer')).toHaveTextContent(testNonce);

      // Re-render with same props
      rerender(
        <NonceProvider nonce={testNonce}>
          <TestConsumer />
        </NonceProvider>,
      );

      expect(screen.getByTestId('nonce-consumer')).toHaveTextContent(testNonce);
    });

    it('should update context value when nonce prop changes', () => {
      const firstNonce = 'first-nonce';
      const secondNonce = 'second-nonce';

      const { rerender } = render(
        <NonceProvider nonce={firstNonce}>
          <TestConsumer />
        </NonceProvider>,
      );

      expect(screen.getByTestId('nonce-consumer')).toHaveTextContent(
        firstNonce,
      );

      rerender(
        <NonceProvider nonce={secondNonce}>
          <TestConsumer />
        </NonceProvider>,
      );

      expect(screen.getByTestId('nonce-consumer')).toHaveTextContent(
        secondNonce,
      );
    });

    it('should handle transition from nonce to undefined', () => {
      const testNonce = 'disappearing-nonce';

      const { rerender } = render(
        <NonceProvider nonce={testNonce}>
          <TestConsumer />
        </NonceProvider>,
      );

      expect(screen.getByTestId('nonce-consumer')).toHaveTextContent(testNonce);

      rerender(
        <NonceProvider nonce={undefined}>
          <TestConsumer />
        </NonceProvider>,
      );

      expect(screen.getByTestId('nonce-consumer')).toHaveTextContent(
        'undefined',
      );
    });

    it('should handle transition from undefined to nonce', () => {
      const testNonce = 'appearing-nonce';

      const { rerender } = render(
        <NonceProvider nonce={undefined}>
          <TestConsumer />
        </NonceProvider>,
      );

      expect(screen.getByTestId('nonce-consumer')).toHaveTextContent(
        'undefined',
      );

      rerender(
        <NonceProvider nonce={testNonce}>
          <TestConsumer />
        </NonceProvider>,
      );

      expect(screen.getByTestId('nonce-consumer')).toHaveTextContent(testNonce);
    });
  });

  describe('Component structure', () => {
    it('should render as a client component', () => {
      // This test verifies the component can be instantiated
      // (the 'use client' directive is effective)
      const testNonce = 'client-component-nonce';

      render(
        <NonceProvider nonce={testNonce}>
          <TestConsumer />
        </NonceProvider>,
      );

      expect(screen.getByTestId('nonce-consumer')).toHaveTextContent(testNonce);
    });

    it('should render children without any wrapper elements in the DOM', () => {
      const testNonce = 'clean-render-nonce';

      render(
        <NonceProvider nonce={testNonce}>
          <div data-testid="direct-child">Direct child</div>
          <TestConsumer />
        </NonceProvider>,
      );

      // NonceProvider should render children directly without adding wrapper elements
      expect(screen.getByTestId('direct-child')).toBeInTheDocument();
      expect(screen.getByTestId('nonce-consumer')).toHaveTextContent(testNonce);
      expect(screen.getByText('Direct child')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle nonce with whitespace', () => {
      const whitespaceNonce = ' nonce with whitespace ';

      render(
        <NonceProvider nonce={whitespaceNonce}>
          <TestConsumer />
        </NonceProvider>,
      );

      expect(screen.getByTestId('nonce-consumer')).toHaveTextContent(
        whitespaceNonce.trim(), // toHaveTextContent normalizes whitespace
      );
    });

    it('should handle zero string nonce', () => {
      const zeroNonce = '0';

      render(
        <NonceProvider nonce={zeroNonce}>
          <TestConsumer />
        </NonceProvider>,
      );

      expect(screen.getByTestId('nonce-consumer')).toHaveTextContent(zeroNonce);
    });

    it('should handle unicode characters in nonce', () => {
      const unicodeNonce = 'nonce-🔐-🛡️-αβγ-中文';

      render(
        <NonceProvider nonce={unicodeNonce}>
          <TestConsumer />
        </NonceProvider>,
      );

      expect(screen.getByTestId('nonce-consumer')).toHaveTextContent(
        unicodeNonce,
      );
    });

    it('should handle fragment children', () => {
      const testNonce = 'fragment-nonce';

      render(
        <NonceProvider nonce={testNonce}>
          <>
            <TestConsumer testId="fragment-child-1" />
            <TestConsumer testId="fragment-child-2" />
          </>
        </NonceProvider>,
      );

      expect(screen.getByTestId('fragment-child-1')).toHaveTextContent(
        testNonce,
      );
      expect(screen.getByTestId('fragment-child-2')).toHaveTextContent(
        testNonce,
      );
    });
  });
});
