'use client';

import { useEffect } from 'react';

/**
 * Starts MSW in the browser during development only.
 * No-ops in production/test.
 */
export default function DevMocks() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      import('@/lib/mocks').catch(() => {
        // ignore if mocks fail to load in dev
      });
    }
  }, []);
  return null;
}
