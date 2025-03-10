import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import logger from '@/lib/logger';

import Page from './page';

jest.mock('@/lib/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

describe('Page', () => {
  it('renders a heading', () => {
    render(<Page />);

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });

  it('logs an info message', () => {
    logger.info('Test info message');
    expect(logger.info).toHaveBeenCalledWith('Test info message');
  });
});
