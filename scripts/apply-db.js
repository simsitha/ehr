#!/usr/bin/env node
/**
 * scripts/apply-db.js
 * Restores or initializes the PostgreSQL database from data/init_data.sql.
 * 
 * Usage:
 *   node scripts/apply-db.js [--force] [--sql data/init_data.sql] [--url postgresql://...]
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');
const { Pool } = require('pg');

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

const args = process.argv.slice(2);
const force = args.includes('--force') || args.includes('-f') || args.includes('--yes') || args.includes('-y');

function getArgValue(name, defaultVal) {
  const idx = args.indexOf(name);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return defaultVal;
}

const defaultPgUri = process.env.DATABASE_URL || 'postgresql://hrm_user:hrm_password@127.0.0.1:5432/hrm_db';
const pgUri = getArgValue('--url', defaultPgUri);
const defaultSqlPath = path.join(rootDir, 'data', 'init_data.sql');
const sqlPath = path.resolve(rootDir, getArgValue('--sql', defaultSqlPath));

// Extract user and password for non-interactive execution & diagnostics
let dbUser = 'hrm_user';
let dbPass = '';
let dbHost = '127.0.0.1';
let dbPort = '5432';
let dbName = 'hrm_db';
const uriMatch = pgUri.match(/postgresql:\/\/([^:]+):([^@]+)@([^:/]+):?([0-9]*)\/(.+)/);
if (uriMatch) {
  dbUser = decodeURIComponent(uriMatch[1]);
  dbPass = decodeURIComponent(uriMatch[2]);
  dbHost = uriMatch[3];
  dbPort = uriMatch[4] || '5432';
  dbName = uriMatch[5];
}

function handlePgError(err, phase) {
  const isAuthError = err.code === '28P01' || (err.message && err.message.toLowerCase().includes('password authentication failed'));
  const isConnRefused = err.code === 'ECONNREFUSED' || (err.message && err.message.includes('ECONNREFUSED'));
  const isDbNotFound = err.code === '3D000' || (err.message && err.message.toLowerCase().includes('database') && err.message.toLowerCase().includes('does not exist'));

  console.error(`\n[ERROR] Database error during ${phase}: ${err.message}`);
  console.error('----------------------------------------------------');

  if (isAuthError) {
    console.error(`Diagnosis: Password authentication failed for user "${dbUser}".`);
    console.error('To resolve this, run the following command on your server:');
    console.error(`  sudo -u postgres psql -c "ALTER USER \\"${dbUser}\\" WITH PASSWORD '${dbPass || 'hrm_password'}' SUPERUSER CREATEDB;"`);
    console.error('\nOr run the automated setup script to provision PostgreSQL:');
    console.error('  sudo ./setup.sh --pg-only');
    console.error('\nAlso verify that DATABASE_URL in .env matches:');
    console.error(`  DATABASE_URL=postgresql://${dbUser}:${dbPass || 'hrm_password'}@${dbHost}:${dbPort}/${dbName}`);
  } else if (isConnRefused) {
    console.error(`Diagnosis: PostgreSQL service is not reachable on ${dbHost}:${dbPort}.`);
    console.error('To start the PostgreSQL service, run:');
    console.error('  sudo systemctl restart postgresql');
  } else if (isDbNotFound) {
    console.error(`Diagnosis: Database "${dbName}" does not exist.`);
    console.error('To create it, run:');
    console.error(`  sudo -u postgres psql -c "CREATE DATABASE ${dbName} OWNER \\"${dbUser}\\";"`);
  } else {
    console.error(`Details: ${err.stack || err.message}`);
  }
  console.error('----------------------------------------------------\n');
}

async function confirmPrompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function main() {
  console.log('----------------------------------------------------');
  console.log('   HESTRAHRM - PostgreSQL Database Initialization');
  console.log('----------------------------------------------------');
  console.log(`[INFO] PostgreSQL URI : ${pgUri.replace(/:[^:@]+@/, ':****@')}`);
  console.log(`[INFO] Source SQL File: ${sqlPath}`);

  if (!fs.existsSync(sqlPath)) {
    console.error(`[ERROR] SQL file not found at: ${sqlPath}`);
    process.exit(1);
  }

  const pool = new Pool({ connectionString: pgUri });
  let hasData = false;

  try {
    const res = await pool.query("SELECT count(*) as c FROM information_schema.tables WHERE table_schema = 'public'");
    const tableCount = parseInt(res.rows[0].c, 10);
    if (tableCount > 0) {
      hasData = true;
    }
  } catch (err) {
    if (err.code === '28P01' || (err.message && err.message.toLowerCase().includes('password authentication failed'))) {
      handlePgError(err, 'connection verification');
      await pool.end();
      process.exit(1);
    }
    console.warn(`[WARN] Could not check existing tables: ${err.message}`);
  }

  if (hasData && !force) {
    console.log(`\n[WARN] An existing PostgreSQL database with tables was detected.`);
    const ans = await confirmPrompt('Are you sure you want to overwrite it with initial data? (y/N): ');
    if (ans !== 'y' && ans !== 'yes') {
      console.log('[INFO] Operation cancelled. Existing database remains untouched.');
      await pool.end();
      process.exit(0);
    }
  }

  // If existing DB has data, create a safety dump first
  if (hasData) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(rootDir, 'data', 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    const backupPath = path.join(backupDir, `safety_before_apply_${timestamp}.sql`);
    try {
      execSync(`pg_dump "${pgUri}" -f "${backupPath}"`, {
        stdio: 'pipe',
        env: { ...process.env, ...(dbPass ? { PGPASSWORD: dbPass } : {}) },
      });
      console.log(`[INFO] Created safety backup: ${backupPath}`);
    } catch (err) {
      console.warn(`[WARN] Could not create safety backup: ${err.message}`);
    }
  }

  console.log('[INFO] Applying SQL data to PostgreSQL...');
  try {
    // Drop and recreate schema public
    await pool.query(`DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO "${dbUser}"; GRANT ALL ON SCHEMA public TO public;`);
    execSync(`psql "${pgUri}" -f "${sqlPath}"`, {
      stdio: 'inherit',
      env: { ...process.env, ...(dbPass ? { PGPASSWORD: dbPass } : {}) },
    });

    console.log('\n[SUCCESS] Database data successfully applied!');
    console.log('\n--- Applied Database Summary ---');
    const tablesRes = await pool.query("SELECT tablename as name FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
    for (const row of tablesRes.rows) {
      const countRes = await pool.query(`SELECT count(*) as c FROM "${row.name}"`);
      const rowCount = countRes.rows[0].c;
      console.log(` - ${row.name.padEnd(28)}: ${rowCount} rows`);
    }
    console.log('--------------------------------\n');
  } catch (err) {
    handlePgError(err, 'SQL application');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[ERROR] Unexpected error:', err);
  process.exit(1);
});
