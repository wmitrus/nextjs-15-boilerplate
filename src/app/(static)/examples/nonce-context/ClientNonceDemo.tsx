'use client';

import { useEffect, useRef, useState } from 'react';

import { useNonce } from '@/context/NonceContext';

/**
 * Minimal demo showing how to use the CSP nonce from context
 * to safely run an inline script.
 */
export default function ClientNonceDemo() {
  const nonce = useNonce();
  const ranRef = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [ran, setRan] = useState(false);

  // This inline script will run once thanks to the nonce
  // It merely sets a data attribute we read back below
  const inlineScript = `document.documentElement.setAttribute('data-inline-ok', 'true')`;

  useEffect(() => {
    // Mark as mounted to avoid SSR/CSR mismatch
    setMounted(true);

    // Avoid double-executions in React strict-mode dev
    if (ranRef.current) return;
    ranRef.current = true;

    // Inject inline script only on client when we have a nonce
    if (nonce) {
      const script = document.createElement('script');
      script.setAttribute('nonce', nonce);
      script.text = inlineScript;
      document.head.appendChild(script);

      // Check result after injection
      const ok =
        document.documentElement.getAttribute('data-inline-ok') === 'true';
      setRan(ok);
    }
  }, [inlineScript, nonce]);

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Nonce from context: <code>{nonce ?? '(none)'}</code>
      </p>

      {/* Only render a script tag after mount to keep SSR/CSR markup consistent */}
      {mounted && nonce ? (
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: inlineScript }}
        />
      ) : null}

      <p>
        Inline script ran:{' '}
        <strong>{ran ? 'Yes' : 'No (check after hydration)'}</strong>
      </p>
    </div>
  );
}
