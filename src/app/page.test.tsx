import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import Page from './(static)/page';

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

// Mock Clerk components
jest.mock('@clerk/nextjs', () => ({
  SignedIn: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="signed-in">{children}</div>
  ),
  SignedOut: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="signed-out">{children}</div>
  ),
  SignInButton: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sign-in-button">{children}</div>
  ),
  SignUpButton: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sign-up-button">{children}</div>
  ),
  UserButton: () => <div data-testid="user-button">User</div>,
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
    const environmentBadge = screen.getByText('Environment Management');
    expect(environmentBadge).toBeInTheDocument();
    // expect(environmentBadge).toHaveClass('rounded-full');
  });
});
