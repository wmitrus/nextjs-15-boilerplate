# Production Readiness Checklist

Use this checklist when preparing to deploy to a custom production domain. Update as you adopt or skip items.

## Security headers

- [ ] Strict-Transport-Security (HSTS)
  - Enable only when your custom domain and all subdomains are HTTPS.
  - Recommended: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
  - Middleware hook location: `src/middleware.ts` (after other security headers)
- [ ] Referrer-Policy: `strict-origin-when-cross-origin` (already set)
- [ ] X-Content-Type-Options: `nosniff` (already set)
- [ ] X-Frame-Options: `DENY` (applied to auth/Clerk routes)
- [ ] Permissions-Policy (review needed values beyond defaults for auth routes)

## Content Security Policy (CSP)

- [ ] Tighten production CSP (avoid broad `https:` allowances)
  - Prefer explicit allowlists via:
    - `NEXT_PUBLIC_CSP_SCRIPT_EXTRA`
    - `NEXT_PUBLIC_CSP_CONNECT_EXTRA`
    - `NEXT_PUBLIC_CSP_FRAME_EXTRA`
    - `NEXT_PUBLIC_CSP_IMG_EXTRA`
    - `NEXT_PUBLIC_CSP_FONT_EXTRA`
    - `NEXT_PUBLIC_CSP_STYLE_EXTRA`
- [ ] Keep `'strict-dynamic'` only when no third-party script hosts are configured
- [ ] Verify Clerk routes include Clerk domains only if used

## CSRF and Same-Origin

- [ ] Ensure `APP_URL` / `NEXT_PUBLIC_APP_URL` are concrete origins (no wildcards)
- [ ] Keep `CSRF_SECURE_COOKIES=true` in production
- [ ] Client fetches use `credentials: 'include'` when cookies are needed

## Rate limiting (Upstash)

- [ ] Set `API_RATE_LIMIT_ENABLED=true` only with valid Upstash credentials
- [ ] Configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- [ ] Tune `API_RATE_LIMIT_REQUESTS` and `API_RATE_LIMIT_WINDOW`

## Environment variables (Vercel)

- [ ] `APP_ENV=production`
- [ ] `APP_URL=https://yourdomain.com`
- [ ] `NEXT_PUBLIC_APP_URL=https://yourdomain.com`
- [ ] `CSRF_SECURE_COOKIES=true`
- [ ] Upstash vars (if rate limiting enabled)
- [ ] Clerk vars (if used): `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- [ ] Optional: `NEXT_PUBLIC_CSP_*` allowlists, logging, Sentry, feature flags

## Preview/Staging hygiene

- [ ] Do not use wildcard `https://*.vercel.app` for `APP_URL`; use a concrete preview URL
- [ ] Keep `NEXT_PUBLIC_*` values aligned with server-only vars where relevant

## Secrets and .env hygiene

- [ ] Never commit secrets to VCS; rotate any accidentally committed keys
- [ ] Ensure `.env.local` is gitignored and not published

## Monitoring & logging

- [ ] Configure Sentry if used (DSN, environment, release)
- [ ] Confirm log levels for production (reduce noise)

## Testing gates

- [ ] E2E tests green on staging/preview
- [ ] Integration/unit tests green

## Misc

- [ ] Remove or deprecate unused example helpers not referenced in app
- [ ] Re-run Lighthouse and bundle checks; address regressions

---

Notes:

- Middleware HSTS reminder is placed in `src/middleware.ts`.
- Update this checklist as you make decisions (e.g., enabling HSTS, tightening CSP, enabling rate limiting).
