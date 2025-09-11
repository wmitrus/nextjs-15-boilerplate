// Lightweight helper to attach CSRF token on unsafe requests
// and include credentials. Works outside React as well.

let cachedToken: string | null = null;
let inflight: Promise<string | null> | null = null;

async function fetchToken(): Promise<string | null> {
  const res = await fetch('/api/security/csrf', {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) return null;
  try {
    const json = await res.json();
    return json?.data?.token || json?.token || null;
  } catch {
    return null;
  }
}

async function getToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  inflight = inflight || fetchToken().finally(() => (inflight = null));
  cachedToken = await inflight;
  return cachedToken;
}

export async function csrfFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  const method = (init.method || 'GET').toUpperCase();
  const unsafe = !['GET', 'HEAD', 'OPTIONS'].includes(method);

  const headers = new Headers(init.headers || {});
  if (unsafe) {
    const token = await getToken();
    headers.set('x-csrf-token', token || '');
  }

  return fetch(input, { ...init, headers, credentials: 'include' });
}
