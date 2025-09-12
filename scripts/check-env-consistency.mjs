#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const repoRoot = process.cwd();
const SRC_DIRS = ['src', 'scripts'];
const IGNORE_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  'storybook-static',
  'coverage',
  'playwright-report',
  'test-results',
]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function extractEnvKeysFromCode(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const re = /process\.env\.([A-Z0-9_]+)/g;
  const found = new Set();
  let m;
  while ((m = re.exec(content))) {
    found.add(m[1]);
  }
  return found;
}

function parseEnvExampleKeys(examplePath) {
  const content = fs.readFileSync(examplePath, 'utf8');
  const re = /^([A-Z0-9_]+)\s*=\s*"?.*$/gm;
  const keys = new Set();
  let m;
  while ((m = re.exec(content))) keys.add(m[1]);
  return keys;
}

function collectManifestKeys(manifestPath) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const keys = new Set(manifest.common?.required || []);
  for (const env of Object.keys(manifest)) {
    if (env === 'common') continue;
    const arr = manifest[env]?.required || [];
    for (const k of arr) keys.add(k);
  }
  return keys;
}

// Keys we intentionally ignore (set by platforms, frameworks, or used only in tests)
const IGNORE_KEYS = new Set([
  // Platform/CI/Next/Vercel provided
  'NODE_ENV',
  'CI',
  'GITHUB_ACTIONS',
  'VERCEL',
  'VERCEL_ENV',
  'VERCEL_URL',
  'VERCEL_GITHUB_COMMIT_SHA',
  'NEXT_RUNTIME',
  // Public computed defaults / mirrors
  'NEXT_PUBLIC_VERCEL_URL',
  // Repo/CI tokens not needed in example
  'CODECOV_TOKEN',
  // Local dev/test-only toggles
  'TEST_LOCAL_RATE_LIMIT',
  'RATE_LIMIT_LOCAL_LIMIT',
  'RATE_LIMIT_LOCAL_WINDOW_MS',
  // CSRF internals (defaulted in code)
  'CSRF_HEADER_NAME',
  'CSRF_ACCEPT_HEADERS',
  'CSRF_COOKIE_PREFIX',
  'CSRF_ROTATE_AFTER_MS',
  'CSRF_SECRET_BYTES',
  'CSRF_SALT_BYTES',
]);

function main() {
  const files = [];
  for (const d of SRC_DIRS) {
    const p = path.join(repoRoot, d);
    if (fs.existsSync(p)) walk(p, files);
  }

  const used = new Set();
  for (const f of files) {
    extractEnvKeysFromCode(f).forEach((k) => used.add(k));
  }

  const envExample = path.join(repoRoot, '.env.example');
  const manifestPath = path.join(repoRoot, 'config/env.required.json');
  const exampleKeys = fs.existsSync(envExample)
    ? parseEnvExampleKeys(envExample)
    : new Set();
  const manifestKeys = fs.existsSync(manifestPath)
    ? collectManifestKeys(manifestPath)
    : new Set();

  const missingInExample = [];
  const missingInManifest = [];

  for (const key of used) {
    if (IGNORE_KEYS.has(key)) continue;
    if (!exampleKeys.has(key)) missingInExample.push(key);
    if (!manifestKeys.has(key)) missingInManifest.push(key);
  }

  let failed = false;
  if (missingInExample.length) {
    console.error('❌ process.env keys missing in .env.example:');
    for (const k of missingInExample) console.error(`- ${k}`);
    failed = true;
  }

  if (missingInManifest.length) {
    console.warn(
      '⚠️  Keys not listed in config/env.required.json (add to the appropriate env if required):',
    );
    for (const k of missingInManifest) console.warn(`- ${k}`);
  }

  if (failed) process.exit(1);
  console.log('✅ Env consistency check passed.');
}

main();
