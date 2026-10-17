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

const args = process.argv.slice(2);
const force = args.includes('--force') || args.includes('-f') || args.includes('--yes') || args.includes('-y');

function getArgValue(name, defaultVal) {
  const idx = args.indexOf(name);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return defaultVal;
}

const rootDir = path.resolve(__dirname, '..');
const defaultPgUri = process.env.DATABASE_URL || 'postgresql://hrm_user:hrm_password@127.0.0.1:5432/hrm_db';
const pgUri = getArgValue('--url', defaultPgUri);
const defaultSqlPath = path.join(rootDir, 'data', 'init_data.sql');
const sqlPath = path.resolve(rootDir, getArgValue('--sql', defaultSqlPath));

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

  // Extract user and password for non-interactive execution
  let dbUser = 'hrm_user';
  let dbPass = '';
  const userMatch = pgUri.match(/postgresql:\/\/([^:]+):([^@]+)@/);
  if (userMatch) {
    dbUser = decodeURIComponent(userMatch[1]);
    dbPass = decodeURIComponent(userMatch[2]);
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
    console.error(`[ERROR] Failed to apply database SQL:`, err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[ERROR] Unexpected error:', err);
  process.exit(1);
});
