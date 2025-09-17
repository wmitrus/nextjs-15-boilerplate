import { NextRequest } from 'next/server';

import {
  FeatureFlagsRequestBody,
  FeatureFlagsResponseData,
} from '@/lib/api/feature-flags';
import { getEnvironmentConfig } from '@/lib/env';
import { createFeatureFlagContext } from '@/lib/feature-flags/hooks';
import { getFeatureFlagProvider } from '@/lib/feature-flags/provider';
import logger from '@/lib/logger';
import {
  createServerErrorResponse,
  createSuccessResponse,
  createValidationErrorResponse,
} from '@/lib/responseService';
import { parseAndSanitizeJson } from '@/lib/security/sanitizeRequest';

// Legacy withCsrf wrapper removed; CSRF is enforced in middleware
export async function POST(request: NextRequest) {
  try {
    logger.info(
      { contentLength: request.headers.get('content-length') },
      'Fetching feature flags via POST',
    );

    // Check if request has content
    const contentLength = request.headers.get('content-length');

    let body: FeatureFlagsRequestBody = {};

    // Only try to parse JSON if there's content
    if (contentLength && contentLength !== '0') {
      const parsed =
        await parseAndSanitizeJson<FeatureFlagsRequestBody>(request);
      if (parsed === null) {
        logger.warn('Invalid JSON format in feature flags request body');
        return createValidationErrorResponse({
          body: ['Invalid JSON format in request body'],
        });
      }
      body = parsed;
    }

    const { userId, tenantId, customProperties } = body;

    // Extract context from request
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      undefined;

    const envConfig = getEnvironmentConfig();

    const context = createFeatureFlagContext(
      userId,
      tenantId,
      envConfig.environment,
      userAgent,
      ipAddress,
      customProperties,
    );

    const provider = getFeatureFlagProvider();
    const flags = await provider.getAllFlags(context);

    const responseData: FeatureFlagsResponseData = {
      flags,
      context: {
        environment: envConfig.environment,
        version: envConfig.version,
      },
    };

    return createSuccessResponse(responseData);
  } catch (error) {
    logger.error(error, 'Feature flags POST API error');
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createServerErrorResponse(
      `Failed to fetch feature flags: ${errorMessage}`,
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || undefined;
    const tenantId = searchParams.get('tenantId') || undefined;

    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      undefined;

    const envConfig = getEnvironmentConfig();

    const context = createFeatureFlagContext(
      userId,
      tenantId,
      envConfig.environment,
      userAgent,
      ipAddress,
    );

    const provider = getFeatureFlagProvider();
    const flags = await provider.getAllFlags(context);

    const responseData: FeatureFlagsResponseData = {
      flags,
      context: {
        environment: envConfig.environment,
        version: envConfig.version,
      },
    };

    return createSuccessResponse(responseData);
  } catch (error) {
    logger.error(error, 'Feature flags POST API error');
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createServerErrorResponse(
      `Failed to fetch feature flags: ${errorMessage}`,
    );
  }
}
