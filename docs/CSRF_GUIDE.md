# CSRF Guide

## Summary

- **Library**: @edge-csrf/core (2.5.3-cloudflare-rc1)
- **Runtime**: Edge (Next.js middleware)
- **Scope**: Applies to /api/\*\* by default
- **Protection**: Same-origin check, double-submit with HttpOnly cookie, token rotation on unsafe methods

## How it works

1. Safe requests (GET/HEAD/OPTIONS):
   - Middleware issues a secret cookie and token and sets `X-CSRF-Token` on the response.
2. Unsafe requests (POST/PUT/PATCH/DELETE):
   - Middleware enforces same-origin and validates the `X-CSRF-Token` against the secret cookie.
   - On success, the secret rotates to prevent token replay.

## Usage

### Client-side fetch (recommended)

```ts
import { csrfFetch } from '@/lib/client/csrfFetch';

await csrfFetch('/api/examples/secure-post', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ name: 'Alice' }),
});
```

### Forms (App Router)

```tsx
import { headers } from 'next/headers';

export default async function Page() {
  const h = await headers();
  const csrfToken = h.get('X-CSRF-Token') || 'missing';
  return (
    <form action="/api/examples/secure-post" method="post">
      <input type="hidden" name="csrf" value={csrfToken} />
      <input type="text" name="name" />
      <button type="submit">Send</button>
    </form>
  );
}
```

### Token prefetch (optional)

```ts
import { useCsrfToken } from '@/lib/security/useCsrf';

const { token, loading, error } = useCsrfToken();
```

## Configuration

- `src/lib/security/csrf/config.ts`
  - **CSRF_HEADER_NAME**: default `x-csrf-token`
  - **CSRF_ACCEPT_HEADERS**: e.g. `x-csrf-token,x-xsrf-token`
  - **CSRF_COOKIE_PREFIX**: prefix cookie names
  - **CSRF_SECRET_BYTES / CSRF_SALT_BYTES**: default 32
  - **CSRF_ROTATE_AFTER_MS**: default 24h
  - **CSRF_SECURE_COOKIES**: `true` in prod
  - **protectPaths**: defaults to `/^\/api/`

Recommended env for prod:

```
APP_URL=https://yourapp.com
NEXT_PUBLIC_APP_URL=https://yourapp.com
CSRF_SECURE_COOKIES=true
```

## Verify locally

1. Start dev server

```bash
pnpm dev
```

2. Get token

```bash
curl -i -c cookies.txt http://localhost:3000/api/security/csrf
```

3. POST without token (expect 403)

```bash
curl -i -b cookies.txt -H "Origin: http://localhost:3000" \
  -X POST http://localhost:3000/api/examples/secure-post \
  -H "Content-Type: application/json" \
  --data '{"name":"Alice"}'
```

4. POST with token (expect 200)

```bash
TOKEN=$(curl -s -i -c cookies.txt http://localhost:3000/api/security/csrf | awk -F': ' '/^X-CSRF-Token:/{print $2}' | tr -d '\r')
curl -i -b cookies.txt -H "Origin: http://localhost:3000" \
  -H "X-CSRF-Token: $TOKEN" \
  -X POST http://localhost:3000/api/examples/secure-post \
  -H "Content-Type: application/json" \
  --data '{"name":"Alice"}'
```

## Tests

- Unit: `pnpm test` (includes `src/lib/security/csrf/edge.test.ts`)
- Integration: `pnpm test:integration`
- E2E: `pnpm e2e` (includes `e2e/csrf.spec.ts`)

## Cleanup notes

- Legacy files removed: `src/lib/security/csrf.ts`, `src/lib/security/withCsrf.ts`, duplicated Playwright test under `tests/csrf.spec.ts`.

## Best practices

- Always send Origin from trusted frontend; use HTTPS.
- Do not share cookie domain with untrusted subdomains.
- Keep tokens short-lived via rotation and default expiry.
