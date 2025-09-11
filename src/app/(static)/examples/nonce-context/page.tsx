import { headers } from 'next/headers';

import { NONCE_HEADER } from '@/lib/security';

import ClientNonceDemo from './ClientNonceDemo';

export const runtime = 'nodejs';

export default async function NonceContextExamplePage() {
  const hdrs = await headers();
  const nonce = hdrs.get(NONCE_HEADER) ?? undefined;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">Nonce Context Example</h1>
      <p>
        This page demonstrates reading the nonce on the server and consuming it
        in a client component via the global NonceContext provider.
      </p>

      <div className="rounded border p-4">
        <p className="text-muted-foreground mb-2 text-sm">
          Server-read nonce (headers): <code>{nonce ?? '(none)'}</code>
        </p>
        <ClientNonceDemo />
      </div>
    </div>
  );
}
