import { NextRequest } from 'next/server';

import { createEdgeCsrf } from '@/lib/security/csrf/edge';

export const runtime = 'edge';

const csrf = createEdgeCsrf();

export async function GET(req: NextRequest) {
  return csrf.issueForRoute(req);
}
