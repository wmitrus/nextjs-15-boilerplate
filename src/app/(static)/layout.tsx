import { ClerkProvider } from '@clerk/nextjs';
import { Geist, Geist_Mono } from 'next/font/google';

import type { Metadata } from 'next';

import '@/app/globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ),
  title: 'Next.js 15 Boilerplate',
  description:
    'A comprehensive Next.js 15 boilerplate with feature flags and multi-tenant support',
  keywords: ['Next.js', 'React', 'TypeScript', 'Boilerplate'],
  authors: [{ name: 'Next.js Team' }],
  openGraph: {
    title: 'Next.js 15 Boilerplate',
    description: 'Modern web development boilerplate with advanced features',
    url: 'https://your-domain.com',
    siteName: 'Next.js 15 Boilerplate',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Next.js 15 Boilerplate',
    description: 'Modern web development boilerplate with advanced features',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function StaticLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {/* Skip link for keyboard navigation */}
          <a
            href="#main-content"
            className="sr-only z-50 rounded bg-indigo-600 px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:outline-2 focus:outline-indigo-500"
          >
            Skip to main content
          </a>
          <div className="flex min-h-screen flex-col">{children}</div>
        </body>
      </html>
    </ClerkProvider>
  );
}
