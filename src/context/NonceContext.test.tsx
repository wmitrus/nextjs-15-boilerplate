'use client';

import { ReactNode } from 'react';

import { render, renderHook, screen } from '@testing-library/react';

import { NonceContext, useNonce } from './NonceContext';

describe('NonceContext', () => {
  describe('NonceContext creation', () => {
    it('should export NonceContext as a valid React context', () => {
      expect(NonceContext).toBeDefined();
      expect(typeof NonceContext.Provider).toBe('object');
      expect(typeof NonceContext.Consumer).toBe('object');
    });
  });

  describe('useNonce hook', () => {
    it('should return undefined when used without provider', () => {
      const { result } = renderHook(() => useNonce());

      expect(result.current).toBeUndefined();
    });

    it('should return nonce value when used with provider', () => {
      const testNonce = 'test-nonce-12345';

      const wrapper = ({ children }: { children: ReactNode }) => (
        <NonceContext.Provider value={testNonce}>
          {children}
        </NonceContext.Provider>
      );

      const { result } = renderHook(() => useNonce(), { wrapper });

      expect(result.current).toBe(testNonce);
    });

    it('should return undefined when provider value is explicitly undefined', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <NonceContext.Provider value={undefined}>
          {children}
        </NonceContext.Provider>
      );

      const { result } = renderHook(() => useNonce(), { wrapper });

      expect(result.current).toBeUndefined();
    });

    it('should return empty string when provider value is empty string', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <NonceContext.Provider value="">{children}</NonceContext.Provider>
      );

      const { result } = renderHook(() => useNonce(), { wrapper });

      expect(result.current).toBe('');
    });

    it('should return updated value when provider value changes', () => {
      const firstNonce = 'first-nonce';
      const secondNonce = 'second-nonce';

      const TestComponent = ({ nonce }: { nonce: string | undefined }) => (
        <NonceContext.Provider value={nonce}>
          <ConsumerComponent />
        </NonceContext.Provider>
      );

      const ConsumerComponent = () => {
        const nonceValue = useNonce();
        return (
          <div data-testid="nonce-consumer">
            {nonceValue === undefined ? 'undefined' : nonceValue}
          </div>
        );
      };

      const { rerender } = render(<TestComponent nonce={firstNonce} />);

      expect(screen.getByTestId('nonce-consumer')).toHaveTextContent(
        firstNonce,
      );

      rerender(<TestComponent nonce={secondNonce} />);
      expect(screen.getByTestId('nonce-consumer')).toHaveTextContent(
        secondNonce,
      );

      rerender(<TestComponent nonce={undefined} />);
      expect(screen.getByTestId('nonce-consumer')).toHaveTextContent(
        'undefined',
      );
    });
  });

  describe('Integration tests', () => {
    it('should work correctly in a nested provider scenario', () => {
      const outerNonce = 'outer-nonce';
      const innerNonce = 'inner-nonce';

      const OuterConsumer = () => {
        const nonce = useNonce();
        return <div data-testid="outer">{nonce}</div>;
      };

      const InnerConsumer = () => {
        const nonce = useNonce();
        return <div data-testid="inner">{nonce}</div>;
      };

      const NestedComponent = () => (
        <NonceContext.Provider value={outerNonce}>
          <OuterConsumer />
          <NonceContext.Provider value={innerNonce}>
            <InnerConsumer />
          </NonceContext.Provider>
        </NonceContext.Provider>
      );

      render(<NestedComponent />);

      expect(screen.getByTestId('outer')).toHaveTextContent(outerNonce);
      expect(screen.getByTestId('inner')).toHaveTextContent(innerNonce);
    });

    it('should work with multiple consumers in the same provider', () => {
      const testNonce = 'shared-nonce';

      const Consumer1 = () => {
        const nonce = useNonce();
        return <div data-testid="consumer-1">{nonce}</div>;
      };

      const Consumer2 = () => {
        const nonce = useNonce();
        return <div data-testid="consumer-2">{nonce}</div>;
      };

      const Consumer3 = () => {
        const nonce = useNonce();
        return <div data-testid="consumer-3">{nonce}</div>;
      };

      const MultipleConsumers = () => (
        <NonceContext.Provider value={testNonce}>
          <Consumer1 />
          <Consumer2 />
          <Consumer3 />
        </NonceContext.Provider>
      );

      render(<MultipleConsumers />);

      expect(screen.getByTestId('consumer-1')).toHaveTextContent(testNonce);
      expect(screen.getByTestId('consumer-2')).toHaveTextContent(testNonce);
      expect(screen.getByTestId('consumer-3')).toHaveTextContent(testNonce);
    });

    it('should handle special characters in nonce value', () => {
      const specialNonce = 'nonce-with-!@#$%^&*()_+-={}[]|\\:";\'<>?,./';

      const wrapper = ({ children }: { children: ReactNode }) => (
        <NonceContext.Provider value={specialNonce}>
          {children}
        </NonceContext.Provider>
      );

      const { result } = renderHook(() => useNonce(), { wrapper });

      expect(result.current).toBe(specialNonce);
    });

    it('should handle very long nonce values', () => {
      const longNonce = 'a'.repeat(1000);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <NonceContext.Provider value={longNonce}>
          {children}
        </NonceContext.Provider>
      );

      const { result } = renderHook(() => useNonce(), { wrapper });

      expect(result.current).toBe(longNonce);
      expect(result.current).toHaveLength(1000);
    });
  });
});
