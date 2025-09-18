import { NextRequest } from 'next/server';

import edgeLogger from '@/lib/logger/edge';
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
    edgeLogger.info({ url: request.url }, 'Processing secure POST request');

    const parsed = await parseAndSanitizeJson<DemoPayload>(request);
    if (parsed === null) {
      edgeLogger.warn('Invalid JSON format in request body');
      return createValidationErrorResponse({
        body: ['Invalid JSON format in request body'],
      });
    }

    const { name = 'Anonymous', message = '' } = parsed;

    edgeLogger.info(
      {
        name,
        messageLength: message.length,
      },
      'Secure POST request processed successfully',
    );

    return createSuccessResponse({
      echoed: {
        name,
        message,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    edgeLogger.error(
      {
        error: msg,
        url: request.url,
      },
      'Secure POST request failed',
    );
    return createServerErrorResponse(`Secure demo failed: ${msg}`);
  }
}
