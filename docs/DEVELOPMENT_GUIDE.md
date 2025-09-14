# Development Guide

A concise, security-focused guide to safely extend this codebase. Use these checklists when adding features or dependencies.

## 1) Adding a third-party library (UI, analytics, SDKs)

1. Review library type and impact
   - UI-only, analytics, auth, widget, network SDK, or server-only?
2. Supply chain and permissions
   - Vet popularity, maintenance, license, and required permissions.
3. CSP allowlists (browser)
   - If it injects or loads remote assets, add exact origins to the right env vars:
     - `NEXT_PUBLIC_CSP_SCRIPT_EXTRA`
     - `NEXT_PUBLIC_CSP_CONNECT_EXTRA`
     - `NEXT_PUBLIC_CSP_IMG_EXTRA`
     - `NEXT_PUBLIC_CSP_FONT_EXTRA`
     - `NEXT_PUBLIC_CSP_STYLE_EXTRA`
   - Prefer exact origins; avoid wildcards. Update docs/security notes if needed.
4. CSP inline/nonces
   - Avoid inline scripts/styles. If unavoidable, rely on nonce via `NonceProvider`.
5. Environment variables
   - Add required keys to `.env.local` for dev and to Vercel for prod/staging.
   - Do not commit secrets. Rotate if leaked.
6. SSR/Edge constraints
   - Ensure it supports Edge/Next runtimes used by your routes.
7. Telemetry and privacy
   - Confirm compliance; disable in local/test as needed.
8. Testing
   - Add unit/integration tests. Update MSW handlers if it performs network calls.

## 2) Adding or updating forms (client and server)

1. Input handling
   - Sanitize on server using `parseAndSanitizeJson` or manual schema parse (Zod) + `sanitizeInput` for text fields.
   - Validate with Zod schemas. Return `createValidationErrorResponse` on errors.
2. CSRF
   - All unsafe requests (POST/PUT/PATCH/DELETE) to `/api/**` must include CSRF header.
   - Client: obtain token from `GET /api/security/csrf` (or use an app hook) and send as header: `x-csrf-token`.
   - Ensure `credentials: 'include'` so CSRF cookies are present.
3. Same-origin
   - Forms must submit to same origin. Avoid cross-origin submissions.
4. Method and content-type
   - Use proper method. Set `Content-Type: application/json` for JSON bodies.
5. Rate limiting
   - Be aware POST routes may be rate limited; surface friendly errors on 429.
6. XSS safety in UI
   - Avoid dangerouslySetInnerHTML. Sanitize any user-generated HTML on server.
7. Accessibility
   - Use labels, errors, focus management. Add tests for basic a11y.

## 3) Adding a new API route

1. Runtime
   - Prefer `export const runtime = 'edge'` when feasible; confirm library compatibility.
2. Request parsing and sanitization
   - For JSON: `parseAndSanitizeJson` to sanitize deeply. Validate with Zod.
3. CSRF
   - Protected by middleware for `/api/**`. For unsafe methods, require the CSRF header.
4. Same-origin enforcement
   - Middleware blocks unsafe cross-origin requests; do not disable.
5. Rate limiting
   - API routes (excluding Clerk/auth) are rate limited if enabled. Tune limits via env.
6. Response helpers
   - Use `createSuccessResponse`, `createValidationErrorResponse`, `createServerErrorResponse`.
7. Error handling
   - Catch errors and return typed responses; avoid leaking internals.
8. CORS (if ever needed)
   - Not enabled by default. If required, implement a narrow allowlist per route.

## 4) Using third-party auth (Clerk) or widgets

1. Limit CSP scope
   - Clerk allowances only on auth-related routes (already handled by middleware).
2. Keys and domains
   - Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`. For non-auth pages loading Clerk, add the Clerk script/frame origins to CSP env vars.
3. Tests
   - Update MSW mocks if calling Clerk or other services in tests.

## 5) Preview/Staging/Prod environment hygiene

1. Concrete origins
   - `APP_URL`/`NEXT_PUBLIC_APP_URL` must be concrete URLs (no wildcards).
2. Cookies and security
   - `CSRF_SECURE_COOKIES=true` in preview/staging/prod.
3. CSP tightening
   - In prod, avoid broad `https:`; add exact origins via env.
4. Rate limiting
   - Enable only with valid Upstash credentials. Tune limits per environment.

## 6) Icons, assets, and CDNs

1. If hosting icons/assets on external CDNs, add origins to `NEXT_PUBLIC_CSP_IMG_EXTRA`, `NEXT_PUBLIC_CSP_FONT_EXTRA`, or `NEXT_PUBLIC_CSP_STYLE_EXTRA`.
2. Prefer bundling local assets when possible to avoid extra allowlist entries.

## 7) MSW and mocking

1. Server MSW starts via `src/instrumentation.ts`.
2. Optional browser MSW in dev: uncomment `<DevMocks />` in `src/app/layout.tsx`.
3. Add/adjust handlers in `src/lib/mocks/**` when integrating new services.

## 8) Performance and bundle safety

1. Re-run size-limit and Lighthouse after major changes.
2. Avoid shipping unused libraries; use dynamic imports if heavy.

## 9) Checklists to copy-paste into PRs

- Third-party lib added:
  - [ ] CSP origins updated (if needed)
  - [ ] Env vars added in dev + Vercel
  - [ ] Tests updated (MSW, unit/integration)
  - [ ] Privacy/telemetry reviewed

- New form:
  - [ ] Server sanitization + validation
  - [ ] CSRF header included on client, credentials included
  - [ ] A11y and XSS reviewed

- New API route:
  - [ ] Runtime chosen (edge/node)
  - [ ] Sanitization + validation
  - [ ] CSRF and rate limiting verified
  - [ ] Typed responses and error handling

---

Keep this guide updated as security features evolve. Reference `docs/PRODUCTION_READINESS_CHECKLIST.md` before release.
