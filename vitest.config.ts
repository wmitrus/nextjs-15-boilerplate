/// <reference types="@vitest/browser/providers/playwright" />

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

/**
 * Vite plugin to stub Storybook's virtual sb-original modules for v9
 */
function sbOriginalVirtuals() {
  return {
    name: 'sb-original-virtuals',
    resolveId(id: string) {
      if (
        id === 'sb-original/image-context' ||
        id === 'sb-original/default-loader'
      ) {
        return id;
      }
      return null;
    },
    load(id: string) {
      if (id === 'sb-original/image-context') {
        // minimal React context stub for ImageDecorator
        return "import { createContext } from 'react'; export const ImageContext = createContext(undefined);";
      }
      if (id === 'sb-original/default-loader') {
        // no-op loader stub for next/image
        return 'export default function defaultLoader() { return ""; }';
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [sbOriginalVirtuals()],

  optimizeDeps: {
    // Exclude the virtual modules from optimization
    exclude: ['sb-original/image-context', 'sb-original/default-loader'],
  },

  define: {
    // Define process for browser environment
    'process.env': {},
    'process.env.NODE_ENV': '"test"',
    global: 'globalThis',
  },

  test: {
    projects: [
      {
        extends: true,
        // storybookTest lives under Vitest’s test pipeline:
        plugins: [
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            provider: 'playwright',
            instances: [
              {
                browser: 'chromium',
                headless: true,
              },
            ],
          },
          setupFiles: ['.storybook/vitest.setup.ts'],
        },
      },
    ],
  },
});
