import { ReactNode } from 'react';

import { Navbar } from '@/components/layout/Navbar';

export default function StaticLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <>
      <Navbar />
      <div className="flex-1">{children}</div>
    </>
  );
}
