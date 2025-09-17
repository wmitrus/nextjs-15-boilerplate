import { NextRequest } from 'next/server';

import logger from '@/lib/logger';
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
    logger.info('Processing secure POST request', { url: request.url });

    const parsed = await parseAndSanitizeJson<DemoPayload>(request);
    if (parsed === null) {
      logger.warn('Invalid JSON format in request body');
      return createValidationErrorResponse({
        body: ['Invalid JSON format in request body'],
      });
    }

    const { name = 'Anonymous', message = '' } = parsed;

    logger.info('Secure POST request processed successfully', {
      name,
      messageLength: message.length,
    });

    return createSuccessResponse({
      echoed: {
        name,
        message,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Secure POST request failed', {
      error: msg,
      url: request.url,
    });
    return createServerErrorResponse(`Secure demo failed: ${msg}`);
  }
}
