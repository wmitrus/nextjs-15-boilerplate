# Content Security Policy (CSP) Guide

## Overview

This project enforces a Content Security Policy via middleware to protect against XSS and related attacks while keeping developer experience smooth in development.

- File: `src/lib/security/csp.ts`
- Applied by: `src/middleware.ts`
- Strategy: Looser in development; strict and allowlist‑based in production.

## Goals

- Prevent unauthorized script/style execution in production
- Support Next.js dev overlay, HMR, and third‑party libraries in development
- Allow domain allowlists via environment variables (no code changes needed)

## Environment behavior

### Development

- script-src: `'self' 'nonce-<nonce>' https: 'unsafe-eval' 'wasm-unsafe-eval'`
- style-src: `'self' 'unsafe-inline' https: data: blob:` (no nonce so inline styles work)
- connect-src: `'self' https: ws: wss:` (for HMR/dev overlay)
- worker-src: `'self' blob: data:` (for blob workers)
- frame-src: `'self' https:`

Rationale: Next.js dev overlay, Clerk and other tools often rely on inline styles, blob workers, and eval in development.

### Production

- script-src: `'self' 'nonce-<nonce>' https:` (no eval)
- style-src: `'self' 'nonce-<nonce>' https: data: blob:` (no unsafe-inline)
- connect-src: `'self' https:` (+ allowlisted domains via env)
- worker-src: `'self' blob: data:` (include only if needed)
- frame-src: `'self' https:` (+ allowlisted domains via env)
- img-src: `'self' data: blob: https:` (+ allowlisted domains via env)
- font-src: `'self' data: https:` (+ allowlisted domains via env)

Rationale: Nonce-based styles/scripts ensure only intended inline code executes. Domain allowlists restrict external connections.

## Environment variables (allowlists)

Declare comma‑separated hostnames/URLs. These are appended to CSP sources when present:

- `NEXT_PUBLIC_CSP_SCRIPT_EXTRA`
- `NEXT_PUBLIC_CSP_CONNECT_EXTRA`
- `NEXT_PUBLIC_CSP_FRAME_EXTRA`
- `NEXT_PUBLIC_CSP_IMG_EXTRA`
- `NEXT_PUBLIC_CSP_FONT_EXTRA`
- `NEXT_PUBLIC_CSP_STYLE_EXTRA`

Example (`.env.production`):

```bash
NEXT_PUBLIC_CSP_SCRIPT_EXTRA=https://cdnjs.cloudflare.com, https://assets.your-cdn.com
NEXT_PUBLIC_CSP_CONNECT_EXTRA=https://api.your-service.com
NEXT_PUBLIC_CSP_FRAME_EXTRA=https://*.clerk.com, https://*.youtube.com
NEXT_PUBLIC_CSP_IMG_EXTRA=https://*.google-analytics.com, https://*.cloudflare.com, https://*.gravatar.com
NEXT_PUBLIC_CSP_FONT_EXTRA=https://fonts.gstatic.com
NEXT_PUBLIC_CSP_STYLE_EXTRA=https://fonts.googleapis.com
```

Notes:

- Wildcards like `*.clerk.com` are allowed in CSP when specified as full scheme+host (`https://*.clerk.com`).
- Prefer `https://` prefixes for remote origins. For same‑origin WebSockets in dev, `ws:`/`wss:` are already included.

## How it’s implemented

- `buildCSP(nonce, { isAuthOrClerkRoute })` in `src/lib/security/csp.ts`
  - Adjusts directives based on `NODE_ENV`
  - Adds WebSocket support in dev
  - Sets `worker-src` and `child-src` for blob workers
  - Reads allowlists from env variables listed above
  - Slightly expands `frame-src` for Clerk on auth routes
- Middleware (`src/middleware.ts`)
  - Creates a per‑request nonce
  - Applies CSP and forwards nonce to server components via header `x-nonce`
  - Root layout reads nonce and provides it via context for components that need it

## Common errors and fixes

1. “Refused to create a worker from blob: … (worker-src not set)”

- Cause: Browser falls back to `script-src` when `worker-src` missing.
- Fix: We set `worker-src 'self' blob: data:`. Keep it if your stack uses blob workers.

2. “Refused to apply inline style … 'unsafe-inline' is ignored if a nonce is present”

- Cause: When a nonce exists in `style-src`, browsers ignore `unsafe-inline`.
- Dev fix: We omit the nonce and use `'unsafe-inline'` so third‑party inline styles work.
- Prod fix: Use nonce only. If needed, consider `style-src-attr 'unsafe-inline'` to allow inline style attributes selectively.

3. “CSP violation for connect to ws://localhost:3000”

- Cause: Missing WebSocket permissions.
- Fix: Dev only: `connect-src` includes `ws:` and `wss:`.

## Verification checklist

- Development
  - [ ] Next.js dev overlay and HMR work
  - [ ] Third‑party widgets render with styles
  - [ ] No CSP violations in console

- Production
  - [ ] No `'unsafe-eval'` or `'unsafe-inline'` in `style-src`
  - [ ] Only required external domains are allowlisted via env
  - [ ] No unexpected CSP violations in browser console

## Updating allowlists

1. Add the external origin(s) to `.env.production` under the correct `NEXT_PUBLIC_CSP_*_EXTRA` variable.
2. Redeploy. The CSP builder will append these to the relevant directives automatically.

## Troubleshooting tips

- Hard refresh the browser (Shift+Reload) after CSP changes to avoid cached policies.
- In dev tools, watch the Console for “Content Security Policy” messages; copy/paste them to determine which directive needs an origin.
- Keep production policy as strict as possible; loosen only the specific directive needed.

## Related docs

- `docs/SECURITY_CONSIDERATIONS.md`
- `docs/CSRF_GUIDE.md`
