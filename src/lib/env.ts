import { createEnv } from '@t3-oss/env-nextjs';
import { levels } from 'pino';
import { z } from 'zod';

// const logLevels = Object.keys(pino.levels.values) as [Level, ...Level[]];
const logLevels = Object.values(levels.labels) as [string, ...string[]];

export const env = createEnv({
  server: {
    NODE_ENV: z.string().min(1),
    LOG_DIR: z.string().min(1),
    CODECOV_TOKEN: z.string().min(1),
    LOG_LEVEL: z.enum(logLevels),
    FILE_LOG_LEVEL: z.enum(logLevels),
    CONSOLE_LOG_LEVEL: z.enum(logLevels),

    LOG_TO_FILE_PROD: z.string().transform((s) => s !== 'false' && s !== '0'),
    LOG_TO_FILE_DEV: z.string().transform((s) => s !== 'false' && s !== '0'),

    LOGFLARE_INTEGRATION_ENABLED: z
      .string()
      .transform((s) => s !== 'false' && s !== '0'),
    LOGFLARE_LOG_LEVEL: z.enum(logLevels),
    LOGFLARE_API_KEY: z.string().min(1),
    LOGFLARE_SOURCE_TOKEN: z.string().min(1),
  },
  client: {
    // NEXT_PUBLIC_LOGFLARE_API_KEY: z.string().min(1),
  },
  // If you're using Next.js < 13.4.4, you'll need to specify the runtimeEnv manually
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    LOG_DIR: process.env.LOG_DIR,
    LOG_LEVEL: process.env.LOG_LEVEL,
    FILE_LOG_LEVEL: process.env.FILE_LOG_LEVEL,
    CONSOLE_LOG_LEVEL: process.env.CONSOLE_LOG_LEVEL,
    LOG_TO_FILE_PROD: process.env.LOG_TO_FILE_PROD,
    LOG_TO_FILE_DEV: process.env.LOG_TO_FILE_DEV,
    LOGFLARE_INTEGRATION_ENABLED: process.env.LOGFLARE_INTEGRATION_ENABLED,
    LOGFLARE_LOG_LEVEL: process.env.LOGFLARE_LOG_LEVEL,
    LOGFLARE_API_KEY: process.env.LOGFLARE_API_KEY,
    LOGFLARE_SOURCE_TOKEN: process.env.LOGFLARE_SOURCE_TOKEN,
    CODECOV_TOKEN: process.env.CODECOV_TOKEN,
  },
  // For Next.js >= 13.4.4, you only need to destructure client variables:
  // experimental__runtimeEnv: {
  //   NEXT_PUBLIC_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_PUBLISHABLE_KEY,
  // }
});
