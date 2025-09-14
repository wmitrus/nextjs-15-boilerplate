import { Suspense } from 'react';

import { ConfigDemo } from '@/components/config-demo';
import { ServerConfigDemo } from '@/components/server-config-demo';

export default function ConfigDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {/* Client-Side Configuration Demo */}
          <section>
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Configuration System Demo</h1>
              <p className="text-muted-foreground">
                Comprehensive demonstration of the centralized configuration
                system
              </p>
            </div>
            <ConfigDemo />
          </section>

          {/* Server-Side Configuration Demo */}
          <section>
            <div className="border-t pt-12">
              <Suspense
                fallback={
                  <div className="py-8 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                    <p className="text-muted-foreground mt-2">
                      Loading server configuration...
                    </p>
                  </div>
                }
              >
                <ServerConfigDemo />
              </Suspense>
            </div>
          </section>

          {/* Usage Examples */}
          <section>
            <div className="border-t pt-12">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">Usage Examples</h2>
                <p className="text-muted-foreground">
                  How to use the configuration system in different contexts
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Client-Side Usage */}
                <div className="bg-card rounded-lg border p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold">
                    Client-Side Usage
                  </h3>
                  <pre className="overflow-x-auto rounded bg-gray-100 p-4 text-sm">
                    {`import { CONFIG, useAppConfig } from '@/config';

// Simple constant access
const apiUrl = CONFIG.BASE_URL;

// React hook
function MyComponent() {
  const config = useAppConfig();
  
  return (
    <div>
      {config.isDevelopment && <DebugPanel />}
      {config.features.analytics && <Analytics />}
    </div>
  );
}`}
                  </pre>
                </div>

                {/* Server-Side Usage */}
                <div className="bg-card rounded-lg border p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold">
                    Server-Side Usage
                  </h3>
                  <pre className="overflow-x-auto rounded bg-gray-100 p-4 text-sm">
                    {`import { getServerConfig } from '@/config';

// API Route
export async function GET() {
  const config = getServerConfig();
  
  // Access sensitive config
  const dbUrl = config.DATABASE.URL;
  const redisUrl = config.EXTERNAL.REDIS.URL;
  
  if (config.FEATURES.rateLimiting) {
    // Apply rate limiting
  }
}`}
                  </pre>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
