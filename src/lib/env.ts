import { createEnv } from '@t3-oss/env-nextjs';
import { pino, Level } from 'pino';
import { z } from 'zod';

const logLevels = Object.keys(pino.levels.values) as [Level, ...Level[]];

export const env = createEnv({
  server: {
    // DATABASE_URL: z.string().url(),
    // OPEN_AI_API_KEY: z.string().min(1),
    NODE_ENV: z.string().min(1),
    LOG_DIR: z.string(),
    LOG_LEVEL: z.enum(logLevels),
    FILE_LOG_LEVEL: z.enum(logLevels),
    CONSOLE_LOG_LEVEL: z.enum(logLevels),

    LOG_TO_FILE_PROD: z.coerce.boolean(),
    LOG_TO_FILE_DEV: z.coerce.boolean(),

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
    LOGFLARE_API_KEY: process.env.LOGFLARE_API_KEY,
    LOGFLARE_SOURCE_TOKEN: process.env.LOGFLARE_API_KEY,
  },
  // For Next.js >= 13.4.4, you only need to destructure client variables:
  // experimental__runtimeEnv: {
  //   NEXT_PUBLIC_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_PUBLISHABLE_KEY,
  // }
});
