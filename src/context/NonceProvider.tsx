'use client';

import React from 'react';

import { NonceContext } from './NonceContext';

// Client component provider that accepts nonce from server layout as prop
export function NonceProvider({
  nonce,
  children,
}: {
  nonce?: string;
  children: React.ReactNode;
}) {
  return (
    <NonceContext.Provider value={nonce}>{children}</NonceContext.Provider>
  );
}
