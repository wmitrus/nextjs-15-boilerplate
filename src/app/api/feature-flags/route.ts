import { NextRequest, NextResponse } from 'next/server';

import { getEnvironmentConfig } from '@/lib/env';
import { createFeatureFlagContext } from '@/lib/feature-flags/hooks';
import { getFeatureFlagProvider } from '@/lib/feature-flags/provider';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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

    return NextResponse.json({
      success: true,
      flags,
      context: {
        environment: envConfig.environment,
        version: envConfig.version,
      },
    });
  } catch (error) {
    console.error('Feature flags API error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch feature flags: ${errorMessage}`,
        flags: {},
      },
      { status: 500 },
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

    return NextResponse.json({
      success: true,
      flags,
      context: {
        environment: envConfig.environment,
        version: envConfig.version,
      },
    });
  } catch (error) {
    console.error('Feature flags API error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch feature flags: ${errorMessage}`,
        flags: {},
      },
      { status: 500 },
    );
  }
}
