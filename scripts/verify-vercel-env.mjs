#!/usr/bin/env node

/**
 * Verify environment variables before deploy/build
 * - Reads required var manifest from config/env.required.json
 * - Detects environment via APP_ENV or VERCEL_ENV
 * - Fails with a clear message if any required variable is missing/empty
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load local env files when not in CI/Vercel so local runs work without manual exports
const isCI =
  !!process.env.CI || !!process.env.GITHUB_ACTIONS || !!process.env.VERCEL;
if (!isCI) {
  const candidates = ['.env.local', '.env.development', '.env'];
  for (const f of candidates) {
    const p = path.resolve(f);
    if (fs.existsSync(p)) dotenv.config({ path: p });
  }
}

// Always attempt to load Vercel-pulled env file in CI if present
// vercel pull --environment=<env> writes .vercel/.env.<env>.local
const appEnvFromContext =
  process.env.APP_ENV || process.env.VERCEL_ENV || 'development';
const vercelEnvName =
  appEnvFromContext === 'production'
    ? 'production'
    : appEnvFromContext === 'preview'
      ? 'preview'
      : 'development';
const vercelEnvPath = path.resolve('.vercel', `.env.${vercelEnvName}.local`);
if (fs.existsSync(vercelEnvPath)) {
  dotenv.config({ path: vercelEnvPath });
}

const manifestPath = path.resolve('config/env.required.json');
if (!fs.existsSync(manifestPath)) {
  console.error('Missing config/env.required.json');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const appEnv = process.env.APP_ENV || process.env.VERCEL_ENV || 'development';

function listMissing(requiredKeys) {
  const missing = [];
  for (const key of requiredKeys) {
    const v = process.env[key];
    if (v === undefined || v === null || String(v).trim() === '') {
      missing.push(key);
    }
  }
  return missing;
}

const commonRequired = manifest.common?.required || [];
const envRequired = manifest[appEnv]?.required || [];
const missing = [...listMissing(commonRequired), ...listMissing(envRequired)];

if (missing.length) {
  console.error(
    `❌ Missing required env vars for ${appEnv}:\n- ${missing.join('\n- ')}`,
  );
  console.error('\nTip:');
  console.error(
    '- Put real secrets in Vercel → Project → Settings → Environment Variables',
  );
  console.error('- Keep placeholders in .env.example only');
  process.exit(2);
}

console.log(`✅ Environment OK for ${appEnv}.`);
