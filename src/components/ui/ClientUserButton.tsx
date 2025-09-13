'use client';

import { useEffect, useState } from 'react';

import { UserButton } from '@clerk/nextjs';

export default function ClientUserButton() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200"></div>
    );
  }

  return (
    <UserButton
      appearance={{
        elements: {
          avatarBox: 'h-8 w-8',
        },
      }}
    />
  );
}
