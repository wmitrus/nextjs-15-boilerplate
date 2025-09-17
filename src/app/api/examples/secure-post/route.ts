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
    logger.info({ url: request.url }, 'Processing secure POST request');

    const parsed = await parseAndSanitizeJson<DemoPayload>(request);
    if (parsed === null) {
      logger.warn('Invalid JSON format in request body');
      return createValidationErrorResponse({
        body: ['Invalid JSON format in request body'],
      });
    }

    const { name = 'Anonymous', message = '' } = parsed;

    logger.info(
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
    logger.error(
      {
        error: msg,
        url: request.url,
      },
      'Secure POST request failed',
    );
    return createServerErrorResponse(`Secure demo failed: ${msg}`);
  }
}
