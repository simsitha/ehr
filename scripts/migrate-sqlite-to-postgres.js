/**
 * scripts/migrate-sqlite-to-postgres.js
 * Migrates complete database schema and all table records from SQLite (data/hr.db)
 * to PostgreSQL (hrm_db).
 */

const Database = require('better-sqlite3');
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

const fs = require('fs');
loadEnv();

const sqlitePath = process.argv[2] || process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'hr.db');
const pgUri = process.env.DATABASE_URL || 'postgresql://hrm_user:hrm_password@127.0.0.1:5432/hrm_db';

async function main() {
  console.log('====================================================');
  console.log('  HESTRAHRM: SQLite -> PostgreSQL Migration');
  console.log('====================================================');
  console.log(`[Source SQLite]: ${sqlitePath}`);
  console.log(`[Target Postgres]: ${pgUri.replace(/:[^:@]+@/, ':****@')}`);

  const sqlite = new Database(sqlitePath);
  const pg = new Pool({ connectionString: pgUri });

  // Test PG connection
  let client;
  try {
    client = await pg.connect();
  } catch (err) {
    console.error(`\n[ERROR] Failed to connect to PostgreSQL: ${err.message}`);
    if (err.code === '28P01' || (err.message && err.message.toLowerCase().includes('password authentication failed'))) {
      console.error('\nRun the following command to reset the PostgreSQL user password:');
      console.error('  sudo -u postgres psql -c "ALTER USER hrm_user WITH PASSWORD \'hrm_password\' SUPERUSER CREATEDB;"');
      console.error('Or run setup.sh:');
      console.error('  sudo ./setup.sh --pg-only\n');
    }
    process.exit(1);
  }
  console.log('[INFO] Connected to PostgreSQL successfully.');

  // Clean public schema
  console.log('[INFO] Resetting public schema in PostgreSQL...');
  await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO hrm_user; GRANT ALL ON SCHEMA public TO public;');

  // Get all tables from SQLite
  const tables = sqlite.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();

  console.log(`[INFO] Found ${tables.length} tables to migrate.`);

  // Create tables in Postgres
  for (const t of tables) {
    let ddl = t.sql;
    // Normalize DDL for PostgreSQL:
    // Replace "users" or `users` with quotes or bare identifier
    // Replace REAL with DOUBLE PRECISION
    // Replace DEFAULT "..." with DEFAULT '...'
    // Replace DEFAULT (datetime('now')) with DEFAULT CURRENT_TIMESTAMP
    let pgDdl = ddl
      .replace(/\bREAL\b/gi, 'DOUBLE PRECISION')
      .replace(/\bDATETIME\b/gi, 'TEXT')
      .replace(/\bBLOB\b/gi, 'BYTEA')
      .replace(/DEFAULT\s+"([^"]*)"/gi, "DEFAULT '$1'")
      .replace(/DEFAULT\s+\(datetime\('now'\)\)/gi, 'DEFAULT CURRENT_TIMESTAMP');

    console.log(`[SCHEMA] Creating table: ${t.name}`);
    try {
      await client.query(pgDdl);
    } catch (err) {
      console.error(`[ERROR] Failed to create table ${t.name}:`, err.message);
      console.error('SQL was:\n', pgDdl);
      throw err;
    }
  }

  // Migrate indexes
  const indexes = sqlite.prepare("SELECT name, tbl_name, sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL").all();
  for (const idx of indexes) {
    let idxSql = idx.sql;
    try {
      console.log(`[INDEX] Creating index: ${idx.name} on ${idx.tbl_name}`);
      await client.query(idxSql);
    } catch (err) {
      console.warn(`[WARN] Could not create index ${idx.name}:`, err.message);
    }
  }

  // Migrate Data
  console.log('\n[INFO] Starting data migration...');
  for (const t of tables) {
    const tableName = t.name;
    const countRow = sqlite.prepare(`SELECT count(*) as c FROM "${tableName}"`).get();
    const totalRows = countRow.c;

    if (totalRows === 0) {
      console.log(`[DATA] ${tableName.padEnd(28)} : 0 rows (skipped)`);
      continue;
    }

    // Get column names
    const pragma = sqlite.prepare(`PRAGMA table_info("${tableName}")`).all();
    const colNames = pragma.map(c => `"${c.name}"`).join(', ');
    const rawColNames = pragma.map(c => c.name);

    // Fetch rows
    const rows = sqlite.prepare(`SELECT * FROM "${tableName}"`).all();

    // Insert into PG in batches
    const batchSize = 200;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      
      await client.query('BEGIN');
      try {
        for (const row of batch) {
          const vals = rawColNames.map(col => {
            const v = row[col];
            return v === undefined ? null : v;
          });
          const placeholders = vals.map((_, idx) => `$${idx + 1}`).join(', ');
          const insertSql = `INSERT INTO "${tableName}" (${colNames}) VALUES (${placeholders})`;
          await client.query(insertSql, vals);
        }
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[ERROR] Failed inserting batch in ${tableName}:`, err.message);
        throw err;
      }
    }

    // Verify row count in PG
    const pgCountRes = await client.query(`SELECT count(*)::int as c FROM "${tableName}"`);
    const pgCount = pgCountRes.rows[0].c;

    const status = pgCount === totalRows ? '✓ SUCCESS' : '✗ MISMATCH';
    console.log(`[DATA] ${tableName.padEnd(28)} : SQLite ${totalRows.toString().padStart(5)} -> Postgres ${pgCount.toString().padStart(5)} [${status}]`);
  }

  client.release();
  await pg.end();
  sqlite.close();

  console.log('\n====================================================');
  console.log('✓ Migration finished successfully with 0 errors.');
  console.log('====================================================');
}

main().catch(err => {
  console.error('\n[FATAL] Migration failed:', err);
  process.exit(1);
});
