#!/usr/bin/env node
/**
 * scripts/dump-db.js
 * Dumps current PostgreSQL database tables and rows to an SQL script (data/init_data.sql).
 * 
 * Usage:
 *   node scripts/dump-db.js [--url postgresql://...] [--out data/init_data.sql]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
function getArgValue(name, defaultVal) {
  const idx = args.indexOf(name);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return defaultVal;
}

const rootDir = path.resolve(__dirname, '..');

// Load environment variables from .env if not already set in process.env
function loadEnv() {
  const envPath = path.join(rootDir, '.env');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (process.env[key] === undefined) {
            process.env[key] = val;
          }
        }
      }
    } catch {
      // Ignore read errors
    }
  }
}

loadEnv();

const defaultPgUri = process.env.DATABASE_URL || 'postgresql://hrm_user:hrm_password@127.0.0.1:5432/hrm_db';
const pgUri = getArgValue('--url', defaultPgUri);
const defaultOutPath = path.join(rootDir, 'data', 'init_data.sql');
const outPath = path.resolve(rootDir, getArgValue('--out', defaultOutPath));

console.log('----------------------------------------------------');
console.log('   HESTRAHRM - PostgreSQL Database Dump / Export');
console.log('----------------------------------------------------');
console.log(`[INFO] PostgreSQL URI : ${pgUri.replace(/:[^:@]+@/, ':****@')}`);
console.log(`[INFO] Output SQL File : ${outPath}`);

// Ensure output dir exists
const outDir = path.dirname(outPath);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

try {
  const passMatch = pgUri.match(/postgresql:\/\/[^:]+:([^@]+)@/);
  const dbPass = passMatch ? decodeURIComponent(passMatch[1]) : '';
  execSync(`pg_dump "${pgUri}" -f "${outPath}"`, {
    stdio: 'inherit',
    env: { ...process.env, ...(dbPass ? { PGPASSWORD: dbPass } : {}) },
  });
  const stat = fs.statSync(outPath);
  console.log(`\n[SUCCESS] Database dumped to ${outPath} (${(stat.size / 1024).toFixed(1)} KB)`);
} catch (err) {
  console.error(`\n[ERROR] Failed to dump PostgreSQL database: ${err.message}`);
  process.exit(1);
}
