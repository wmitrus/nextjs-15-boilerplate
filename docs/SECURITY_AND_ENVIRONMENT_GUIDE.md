# Security and Environment Guide

A comprehensive overview of the security features, environment configurations, and recent changes. This guide is designed to be user-friendly and developer-friendly, with precise steps and rationale.

## Contents

1. Included solutions and exceptions
2. Environment configuration matrix (dev, test, preview, staging, prod)
3. Security variables reference (what, why, when)
4. How mocking (MSW) and Clerk are handled in dev/test
5. Middleware and rate limiting behavior (including Upstash changes)
6. Practical setup checklists

---

## 1) Included solutions and exceptions

- CSRF protection (Edge-safe)
  - Built with `@edge-csrf/core` and Next.js `NextResponse`.
  - Token issuance endpoint: `GET /api/security/csrf` (JSON, header also set).
  - Cookies are `httpOnly`, `sameSite=strict`, and `secure` in production.
  - Only applied to protected paths (by default: `^/api`).
  - Secret rotation on safe requests after a configurable period; forced rotation after a successful unsafe request.

- Content Security Policy (CSP) with runtime nonce
  - Per-request nonce generated in middleware.
  - Strict configuration with optional allowances for third-party hosts via env.
  - Auth/Clerk routes get the correct script/frame allowances.
  - "strict-dynamic" used when no third-party script hosts are configured.

- Rate limiting (Upstash)
  - Configurable by env; disabled in dev, enabled in higher envs when credentials provided.
  - Soft-fail behavior in environments that do not support `fetch keepalive` or when Upstash fails (prevents crashes).

- MSW (Mock Service Worker)
  - Server-side: started in `src/instrumentation.ts` with onUnhandledRequest filtering.
  - Browser-side (dev only): optional lightweight bootstrap via `src/components/DevMocks.tsx`.
  - Clerk API mocks cover both `api.clerk.dev` (tests) and `api.clerk.com` (development).

- Multi-tenant request handling
  - Applied early in middleware via `createTenantMiddleware()`.

- Security headers
  - CSP, Referrer-Policy, X-Content-Type-Options are set globally.
  - Additional `X-Frame-Options` and `Permissions-Policy` on auth/Clerk routes.

- Exceptions / special cases
  - Unmocked host allowlist in `src/instrumentation.ts` prevents MSW warnings for known domains (Next internals, telemetry, etc.).
  - Rate limiting is skipped for Clerk auth routes and `/api/auth`.
  - CSRF issuance endpoint is excluded from CSRF application to avoid double-minting.

---

## 2) Environment configuration matrix

Below are the recommended defaults and their rationale. Adjust values according to your deployment domain and service usage.

### Development (.env.development)

- NODE_ENV="development"
- APP_ENV="development"
- API_RATE_LIMIT_ENABLED="false" (avoid Upstash dependency locally)
- CSRF_SECURE_COOKIES=false (secure cookies not required on http://localhost)
- APP_URL / NEXT_PUBLIC_APP_URL="http://localhost:3000"
- NEXT_PUBLIC_CSP_SCRIPT_EXTRA=https://\*.clerk.accounts.dev (if using Clerk dev scripts)
- Clerk dev keys: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY
- Logging: verbose console, optional file logs

Why: Fast local iteration, no external dependencies required. CSP loosened only for Clerk dev scripts if used.

### Test (.env.test)

- NODE_ENV="test"
- APP_ENV="test"
- MULTI_TENANT_ENABLED=false (simplify tests)
- CSRF*COOKIE_PREFIX=foo* (stable cookie names for assertions)
- NEXT_PUBLIC_CSP_SCRIPT_EXTRA=https://\*.clerk.accounts.dev (if testing Clerk UI)

Why: Deterministic behavior for unit/E2E tests. External integrations are disabled or mocked.

### Preview (.env.preview)

- NODE_ENV="production"
- APP_ENV="preview"
- API_RATE_LIMIT_ENABLED="true" only if Upstash creds provided; otherwise set to "false"
- CSRF_SECURE_COOKIES=true
- APP_URL / NEXT_PUBLIC_APP_URL set to your preview domain
- If using Clerk in preview, add script/frame allowances: `https://js.clerk.com, https://*.clerk.com, https://*.clerk.services`

Why: Production-like environment with secure cookies, optional rate limiting.

### Staging (.env.staging)

- NODE_ENV="production"
- APP_ENV="staging"
- API_RATE_LIMIT_ENABLED="true" only if Upstash creds provided
- CSRF_SECURE_COOKIES=true
- APP_URL / NEXT_PUBLIC_APP_URL set to staging domain
- Clerk allowances if used

Why: Mirrors production policies; validates integrations before release.

### Production (.env.production)

- NODE_ENV="production"
- APP_ENV="production"
- API_RATE_LIMIT_ENABLED="true" (requires Upstash creds)
- CSRF_SECURE_COOKIES=true
- APP_URL / NEXT_PUBLIC_APP_URL set to the canonical domain
- CSP allowlists kept minimal: add only the third-party hosts you actually load/connect to.

Why: Maximum security with strict origins, secure cookies, and least-privilege CSP.

---

## 3) Security variables reference

- CSRF_HEADER_NAME
  - Default: `x-csrf-token`
  - What: Response header carrying CSRF token; also accepted as request header for unsafe methods.
  - When: Change if your infrastructure prefers a custom header.

- CSRF_ACCEPT_HEADERS
  - Default: `x-csrf-token,x-xsrf-token`
  - What: Comma-separated list of headers accepted for CSRF verification.
  - When: Add aliases if a proxy or client uses a different header name.

- CSRF_COOKIE_PREFIX
  - Default: empty
  - What: Prefix for CSRF cookies (`<prefix>csrf-secret`, `<prefix>csrf-iat`).
  - When: Use in test or multi-app environments to avoid cookie name collisions.

- CSRF_ROTATE_AFTER_MS
  - Default: 24h
  - What: Age after which the CSRF secret is rotated on safe requests.
  - When: Reduce in high-security environments; keep ≥ minutes to avoid thrash.

- CSRF_SECRET_BYTES
  - Default: 32
  - What: Secret length for CSRF token derivation.
  - When: Rarely changed; 32 bytes is strong.

- CSRF_SALT_BYTES
  - Default: 32
  - What: Salt length for CSRF token derivation.
  - When: Rarely changed; 32 bytes is strong.

- CSRF_SECURE_COOKIES
  - Default: true in production; false otherwise (unless explicitly set true)
  - What: Sets `secure` flag for CSRF cookies.
  - When: Must be true on HTTPS; false on local http for convenience.

- CORS_ORIGINS
  - Default: `*` (example defaults vary per env file)
  - What: Allowed origins for CORS checks (if/where enforced by your handlers).
  - When: Set to your exact domains in higher environments.

- ALLOWED_HOSTS
  - Optional
  - What: List of allowed Host headers (if you implement host checks).
  - When: Use behind proxies/CDNs to prevent Host header attacks.

- NEXT_PUBLIC_CSP_SCRIPT_EXTRA
  - What: Comma-separated script origins to allow in CSP.
  - When: Add CDN/script hosts (e.g., `https://js.clerk.com`). Use only what you need.

- NEXT_PUBLIC_CSP_CONNECT_EXTRA
  - What: Comma-separated connect origins for XHR/fetch/WebSocket.
  - When: Add APIs/telemetry hosts you contact from the browser.

- NEXT_PUBLIC_CSP_FRAME_EXTRA
  - What: Additional frame ancestors / iframe sources.
  - When: Add only if embedding third-party frames (Clerk, YouTube, etc.).

- NEXT_PUBLIC_CSP_IMG_EXTRA
  - What: Additional image origins (analytics, CDN, avatars).

- NEXT_PUBLIC_CSP_FONT_EXTRA
  - What: Additional font origins (e.g., `https://fonts.gstatic.com`).

- NEXT_PUBLIC_CSP_STYLE_EXTRA
  - What: Additional style origins (e.g., `https://fonts.googleapis.com`).

- API_RATE_LIMIT_ENABLED
  - What: Master toggle for rate limiting.
  - When: Enable in preview/staging/prod when Upstash creds are configured.

- API_RATE_LIMIT_REQUESTS, API_RATE_LIMIT_WINDOW
  - What: Limit parameters (requests per time window).
  - When: Tune per environment and risk appetite.

- UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
  - What: Upstash REST credentials.
  - When: Required to enable rate limiting; if missing, keep API_RATE_LIMIT_ENABLED=false.

- NONCE_HEADER (constant)
  - Value: `x-nonce`
  - What: Internal header used to forward nonce from middleware to server components.

---

## 4) Mocking and Clerk in dev/test

- Server-side MSW
  - Initialized in `src/instrumentation.ts` for Node.js runtime.
  - Filters out unhelpful warnings for specific hosts and Next internals.

- Browser-side MSW (development only)
  - Component: `src/components/DevMocks.tsx`.
  - Usage: Include `<DevMocks />` near the top of `src/app/layout.tsx` inside the body to start browser MSW during development.
  - Note: It’s currently commented out in layout; uncomment to enable.

- Clerk API mocks
  - Tests: `api.clerk.dev` endpoints are mocked.
  - Development: additional handlers for `api.clerk.com` are included to prevent unhandled request warnings.

---

## 5) Middleware and rate limiting behavior (including Upstash changes)

- Tenant middleware runs first; does not short-circuit.
- Rate limiting applies only to API routes that are not Clerk/auth (`/api`, excluding `/api/auth` and paths containing `clerk`).
- CSP + nonce are generated per request, with stronger restrictions on non-auth routes.
- CSRF apply step:
  - Protects only configured paths (default matches `/api`).
  - Issues and rotates tokens as needed; blocks unsafe cross-origin requests.

### What changed for Upstash and error handling

- Redis client creation now requires BOTH of:
  - `API_RATE_LIMIT_ENABLED = true`, and
  - valid `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
- Middleware wraps the rate-limit check in a try/catch.
  - If the environment lacks `fetch keepalive` or the Upstash call fails, the middleware soft-fails (does not block the request) and logs a warning.

### Does it still protect what you had?

- Yes. When rate limiting is enabled and Upstash credentials are present, behavior is unchanged: limits are enforced and 429 responses include rate-limit headers.
- In environments without credentials or with runtime limitations, requests won’t crash the app. You can still enable strict rate limiting by providing credentials and keeping the toggle on.

---

## 6) Practical setup checklists

### Development

1. Keep `API_RATE_LIMIT_ENABLED="false"`.
2. Use Clerk dev keys; allow `https://*.clerk.accounts.dev` via `NEXT_PUBLIC_CSP_SCRIPT_EXTRA` if needed.
3. Uncomment `<DevMocks />` in `src/app/layout.tsx` to enable browser MSW.

### Test

1. `NODE_ENV=test` and `APP_ENV=test`.
2. Set `CSRF_COOKIE_PREFIX` for stable cookie names in assertions.
3. MSW mocks handle Clerk `api.clerk.dev`.

### Preview/Staging

1. Set your domain in `APP_URL` and `NEXT_PUBLIC_APP_URL`.
2. Set `CSRF_SECURE_COOKIES=true`.
3. Provide Upstash creds and enable `API_RATE_LIMIT_ENABLED="true"`, or keep it `false` until ready.
4. Add only the third-party CSP hosts you actually use.

### Production

1. Set canonical `APP_URL`/`NEXT_PUBLIC_APP_URL`.
2. Keep `CSRF_SECURE_COOKIES=true`.
3. Provide Upstash creds; keep `API_RATE_LIMIT_ENABLED="true"`.
4. Keep CSP allowlists minimal and exact.

---

## Appendix: Key files

- Middleware: `src/middleware.ts`
- CSRF: `src/lib/security/csrf/*`, API route `src/app/api/security/csrf/route.ts`
- CSP: `src/lib/security/csp.ts`
- Rate limiting: `src/lib/rate-limit.ts`
- MSW server: `src/instrumentation.ts`, handlers: `src/lib/mocks/*`
- MSW browser (dev): `src/components/DevMocks.tsx`
