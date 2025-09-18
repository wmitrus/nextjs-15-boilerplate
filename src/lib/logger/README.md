# Logger Usage Guide

## Server-side (Node.js runtime)

Use the full pino logger with all features:

```typescript
import logger from '@/lib/logger'; // or '@/lib/logger/pino'
logger.info({ userId: 123 }, 'User logged in');
```

## Edge Runtime API Routes & Middleware

Use the edge logger that works without Node.js modules:

```typescript
import edgeLogger from '@/lib/logger/edge';
edgeLogger.info({ userId: 123 }, 'User action');
```

## Client-side Components

Use the browser-compatible pino logger:

```typescript
'use client';
import browserLogger from '@/lib/logger/browser';
browserLogger.info({ event: 'button_click' }, 'User interaction');
```

## Legacy Client Logger

For existing client code, you can still use:

```typescript
import clientLogger from '@/lib/logger/client';
clientLogger.info('Simple message');
```
