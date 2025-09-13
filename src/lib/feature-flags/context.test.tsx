import '@testing-library/jest-dom';
import React from 'react';

import { render, screen, waitFor, act } from '@testing-library/react';

import {
  FeatureFlagProvider,
  useFeatureFlag,
  useFeatureFlags,
} from './context';

function getUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof Request) return input.url;
  if (input instanceof URL) return input.toString();
  const maybe = input as { url?: string };
  return maybe.url ?? String(input);
}

// Mock component to test useFeatureFlags hook
const TestFeatureFlagsComponent = () => {
  const { flags, isLoading, isEnabled, getValue, refresh } = useFeatureFlags();

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'loaded'}</div>
      <div data-testid="flags-count">{Object.keys(flags).length}</div>
      <div data-testid="new-dashboard-enabled">
        {isEnabled('new-dashboard') ? 'enabled' : 'disabled'}
      </div>
      <div data-testid="dark-mode-value">
        {getValue('dark-mode', false) ? 'true' : 'false'}
      </div>
      <button onClick={refresh} data-testid="refresh-button">
        Refresh
      </button>
    </div>
  );
};

// Mock component to test useFeatureFlag hook
const TestFeatureFlagComponent = () => {
  const newDashboard = useFeatureFlag('new-dashboard');
  const darkMode = useFeatureFlag('dark-mode');

  return (
    <div>
      <div data-testid="new-dashboard-flag">
        {newDashboard.isEnabled ? 'enabled' : 'disabled'}
      </div>
      <div data-testid="dark-mode-flag">
        {darkMode.isEnabled ? 'enabled' : 'disabled'}
      </div>
    </div>
  );
};

describe('FeatureFlagProvider', () => {
  const mockFlags = {
    'new-dashboard': {
      key: 'new-dashboard',
      enabled: true,
      description: 'Enable the new dashboard UI',
    },
    'dark-mode': {
      key: 'dark-mode',
      enabled: false,
      description: 'Enable dark mode theme',
    },
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Mock fetch API by endpoint (CSRF vs Feature Flags)
    global.fetch = jest.fn((input: RequestInfo | URL) => {
      const url = getUrl(input);

      if (url.includes('/api/security/csrf')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'ok', data: { token: 'test-token' } }),
        } as Response);
      }

      if (url.includes('/api/feature-flags')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'ok', data: { flags: mockFlags } }),
        } as Response);
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      } as Response);
    }) as jest.Mock;
  });

  afterEach(() => {
    // Clean up mocks
    jest.restoreAllMocks();
  });

  it('renders children and loads feature flags', async () => {
    render(
      <FeatureFlagProvider>
        <div data-testid="child">Child component</div>
      </FeatureFlagProvider>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();

    // Wait only for the call to be present, then assert outside
    await waitFor(() => {
      const call = (fetch as jest.Mock).mock.calls.find(([input]) =>
        getUrl(input).includes('/api/feature-flags'),
      );
      expect(Boolean(call)).toBe(true);
    });

    const call = (fetch as jest.Mock).mock.calls.find(([input]) =>
      getUrl(input).includes('/api/feature-flags'),
    ) as [RequestInfo | URL, RequestInit] | undefined;
    expect(call).toBeTruthy();
    const [, init] = call!;
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual(
      expect.objectContaining({ 'Content-Type': 'application/json' }),
    );
    expect(init.body).toBe(JSON.stringify({}));
  });

  it('provides feature flags through useFeatureFlags hook', async () => {
    render(
      <FeatureFlagProvider>
        <TestFeatureFlagsComponent />
      </FeatureFlagProvider>,
    );

    // Initially loading
    expect(screen.getByTestId('loading')).toHaveTextContent('loading');

    // After loading
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    expect(screen.getByTestId('flags-count')).toHaveTextContent('2');
    expect(screen.getByTestId('new-dashboard-enabled')).toHaveTextContent(
      'enabled',
    );
    expect(screen.getByTestId('dark-mode-value')).toHaveTextContent('false');
  });

  it('provides individual feature flags through useFeatureFlag hook', async () => {
    render(
      <FeatureFlagProvider>
        <TestFeatureFlagComponent />
      </FeatureFlagProvider>,
    );

    // Wait for flags to be loaded by checking the actual flag values
    await waitFor(() => {
      expect(screen.getByTestId('new-dashboard-flag')).toHaveTextContent(
        'enabled',
      );
    });

    expect(screen.getByTestId('new-dashboard-flag')).toHaveTextContent(
      'enabled',
    );
    expect(screen.getByTestId('dark-mode-flag')).toHaveTextContent('disabled');
  });

  it('handles fetch errors gracefully', async () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    // Mock fetch to simulate an error
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('Network error')),
    );

    render(
      <FeatureFlagProvider>
        <TestFeatureFlagsComponent />
      </FeatureFlagProvider>,
    );

    // Should still render children even with fetch error
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load feature flags:',
      expect.any(Error),
    );

    // Restore console.error
    consoleSpy.mockRestore();
  });

  it('uses initial flags when provided', async () => {
    const initialFlags = {
      'beta-features': {
        key: 'beta-features',
        enabled: true,
      },
    };

    render(
      <FeatureFlagProvider initialFlags={initialFlags}>
        <TestFeatureFlagsComponent />
      </FeatureFlagProvider>,
    );

    // Should use initial flags immediately
    expect(screen.getByTestId('flags-count')).toHaveTextContent('1');

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });
  });

  it('refreshes feature flags when refresh is called', async () => {
    render(
      <FeatureFlagProvider>
        <TestFeatureFlagsComponent />
      </FeatureFlagProvider>,
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    // Click refresh button
    const refreshButton = screen.getByTestId('refresh-button');
    await act(async () => {
      refreshButton.click();
    });

    // Should call feature-flags endpoint again (ignore CSRF calls)
    await waitFor(() => {
      const featureCalls = (fetch as jest.Mock).mock.calls.filter(([input]) =>
        getUrl(input).includes('/api/feature-flags'),
      );
      expect(featureCalls.length >= 2).toBe(true);
    });

    const featureCalls = (fetch as jest.Mock).mock.calls.filter(([input]) =>
      getUrl(input).includes('/api/feature-flags'),
    );
    expect(featureCalls.length).toBe(2);
  });

  it('throws error when useFeatureFlags is used outside provider', () => {
    const TestComponent = () => {
      try {
        useFeatureFlags();
        return <div>No error thrown</div>;
      } catch (error) {
        return <div data-testid="error">{(error as Error).message}</div>;
      }
    };

    render(<TestComponent />);

    expect(screen.getByTestId('error')).toHaveTextContent(
      'useFeatureFlags must be used within a FeatureFlagProvider',
    );
  });

  it('throws error when useFeatureFlag is used outside provider', () => {
    const TestComponent = () => {
      try {
        useFeatureFlag('new-dashboard');
        return <div>No error thrown</div>;
      } catch (error) {
        return <div data-testid="error">{(error as Error).message}</div>;
      }
    };

    render(<TestComponent />);

    expect(screen.getByTestId('error')).toHaveTextContent(
      'useFeatureFlags must be used within a FeatureFlagProvider',
    );
  });

  it('returns default value when flag is enabled but has no value', async () => {
    const flagsWithNoValue = {
      'new-dashboard': {
        key: 'new-dashboard',
        enabled: true,
        value: null, // Explicitly set to null to test the ?? operator
      },
    };

    // Mock fetch to return flag without value (for /api/feature-flags)
    (global.fetch as jest.Mock).mockImplementationOnce(
      (input: RequestInfo | URL) => {
        const url = getUrl(input);
        if (url.includes('/api/feature-flags')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              status: 'ok',
              data: { flags: flagsWithNoValue },
            }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        } as Response);
      },
    );

    const TestComponent = () => {
      const { getValue } = useFeatureFlags();
      return (
        <div data-testid="flag-value">
          {getValue('new-dashboard', 'default-value')}
        </div>
      );
    };

    render(
      <FeatureFlagProvider>
        <TestComponent />
      </FeatureFlagProvider>,
    );

    // Wait for flags to be loaded
    await waitFor(() => {
      expect(screen.getByTestId('flag-value')).toHaveTextContent(
        'default-value',
      );
    });
  });

  it('returns flag value when flag is enabled and has a value', async () => {
    const flagsWithValue = {
      'subscription-tier': {
        key: 'subscription-tier',
        enabled: true,
        value: 'premium',
      },
    };

    // Mock fetch to return flag with value (for /api/feature-flags)
    (global.fetch as jest.Mock).mockImplementationOnce(
      (input: RequestInfo | URL) => {
        const url = getUrl(input);
        if (url.includes('/api/feature-flags')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              status: 'ok',
              data: { flags: flagsWithValue },
            }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        } as Response);
      },
    );

    const TestComponent = () => {
      const { getValue } = useFeatureFlags();
      return (
        <div data-testid="flag-value">
          {getValue('subscription-tier', 'default-value')}
        </div>
      );
    };

    render(
      <FeatureFlagProvider>
        <TestComponent />
      </FeatureFlagProvider>,
    );

    // Wait for flags to be loaded
    await waitFor(() => {
      expect(screen.getByTestId('flag-value')).toHaveTextContent('premium');
    });
  });
});
