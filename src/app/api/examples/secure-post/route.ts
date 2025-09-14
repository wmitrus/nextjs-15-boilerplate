import { NextRequest } from 'next/server';

import {
  createServerErrorResponse,
  createSuccessResponse,
  createValidationErrorResponse,
} from '@/lib/responseService';
import { parseAndSanitizeJson } from '@/lib/security/sanitizeRequest';

export const runtime = 'edge';

interface DemoPayload {
  name?: string;
  message?: string;
}

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseAndSanitizeJson<DemoPayload>(request);
    if (parsed === null) {
      return createValidationErrorResponse({
        body: ['Invalid JSON format in request body'],
      });
    }

    const { name = 'Anonymous', message = '' } = parsed;

    return createSuccessResponse({
      echoed: {
        name,
        message,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return createServerErrorResponse(`Secure demo failed: ${msg}`);
  }
}
