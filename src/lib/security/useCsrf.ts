import { useEffect, useState } from 'react';

/**
 * React hook to prefetch and cache CSRF token on the client.
 * - Uses the standard token endpoint.
 */
export function useCsrfToken() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetch('/api/security/csrf', { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => {
        if (!isMounted) return;
        const t = j?.data?.token || j?.token || null;
        setToken(t);
      })
      .catch((e) => {
        if (!isMounted) return;
        setError(e?.message || 'Failed to fetch CSRF token');
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return { token, loading, error } as const;
}
