import { ClerkProvider } from '@clerk/nextjs';
import { Geist, Geist_Mono } from 'next/font/google';
import { headers } from 'next/headers';

// import DevMocks from '@/components/DevMocks';
import { NonceProvider } from '@/context/NonceProvider';
import { NONCE_HEADER } from '@/lib/security';

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read nonce forwarded by middleware to attach to potential inline usages
  const hdrs = await headers();
  const nonce = hdrs.get(NONCE_HEADER) ?? undefined;

  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: '#4f46e5',
        },
      }}
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {/* Provide nonce to downstream client components via context */}
          <NonceProvider nonce={nonce}>
            {/* Start MSW in browser during development */}
            {/* <DevMocks /> */}
            <main className="flex min-h-screen flex-col">{children}</main>
          </NonceProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
