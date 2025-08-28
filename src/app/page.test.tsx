import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import Page from './page';

jest.mock('@/lib/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Mock the multi-tenant module to avoid importing server-side dependencies
jest.mock('@/lib/multi-tenant', () => ({
  useTenant: () => ({
    tenant: null,
    isMultiTenant: false,
    tenantId: 'default',
  }),
}));

// Mock the feature-flags module
jest.mock('@/lib/feature-flags', () => ({
  useFeatureFlag: (flagKey: string) => {
    // Mock implementation for feature flags
    const mockFlags: Record<string, { isEnabled: boolean }> = {
      'new-dashboard': { isEnabled: true },
      'dark-mode': { isEnabled: false },
    };

    return mockFlags[flagKey] || { isEnabled: false };
  },
}));

describe('Page', () => {
  it('renders a heading', () => {
    render(<Page />);

    const heading = screen.getByRole('heading', {
      name: /Modern Web Development/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it('displays environment information', () => {
    render(<Page />);

    // Target the header environment badge specifically by its CSS class and exact text
    const environmentBadge = screen.getByText('DEVELOPMENT');
    expect(environmentBadge).toBeInTheDocument();
    expect(environmentBadge).toHaveClass('rounded-full');
  });
});
