#!/usr/bin/env node
/**
 * Smoke check that critical KEOS paths exist after scaffold.
 */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const required = [
  'apps/web/package.json',
  'packages/ui/src/index.ts',
  'packages/auth/src/index.ts',
  'supabase/migrations/0001_foundation.sql',
  'docs/architecture/ADR-001-foundation-architecture-decisions.md',
  'pnpm-workspace.yaml',
  'turbo.json',
];

let ok = true;
for (const rel of required) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    console.error('Missing:', rel);
    ok = false;
  }
}

if (!ok) process.exit(1);
console.log('KEOS scaffold paths OK');
