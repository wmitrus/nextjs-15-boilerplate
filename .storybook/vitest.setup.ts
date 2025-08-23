import { beforeAll } from 'vitest';
import { setProjectAnnotations } from '@storybook/nextjs-vite';
import * as projectAnnotations from './preview';

// Polyfill process for browser environment
if (typeof process === 'undefined') {
  (globalThis as any).process = {
    env: { NODE_ENV: 'test' },
    browser: true,
    version: '',
    versions: { node: '' },
  };
}

// This is an important step to apply the right configuration when testing your stories.
// More info at: https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest#setprojectannotations
const project = setProjectAnnotations([projectAnnotations]);

beforeAll(project.beforeAll);
