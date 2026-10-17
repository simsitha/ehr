/**
 * src/lib/pg-adapter.ts
 * High-performance synchronous PostgreSQL database adapter for Next.js.
 * Provides a better-sqlite3 compatible API (.prepare(), .all(), .get(), .run(), .transaction(), .exec())
 * backed by PostgreSQL via worker_threads and SharedArrayBuffer + Atomics.
 */

import { Worker } from 'worker_threads';

export interface RunResult {
  changes: number;
  lastInsertRowid: number;
}

export interface Statement<T = any> {
  all(...params: any[]): T[];
  get(...params: any[]): T | undefined;
  run(...params: any[]): RunResult;
}

const DEFAULT_DATABASE_URL = 'postgresql://hrm_user:hrm_password@127.0.0.1:5432/hrm_db';

const CONFLICT_KEYS: Record<string, string> = {
  system_meta: 'key',
  attendance: 'employee_id, date',
  duty_roster: 'employee_id, date',
  sewing_production_weekly: 'week_start, employee_id',
  leave_balances: 'employee_id',
  it_assets: 'asset_tag',
  it_m365_accounts: 'email',
  payroll_periods: 'name',
  employee_groups: 'name',
  attendance_status_codes: 'code',
  attendance_devices: 'id',
  attendance_device_users: 'device_id, device_user_id',
  attendance_raw_transactions: 'device_id, transaction_id',
  attendance_sync_jobs: 'id',
  attendance_sync_logs: 'id',
  attendance_corrections: 'id',
  medicines: 'id',
  employee_medical_records: 'id',
  medicine_issuances: 'id',
  medicine_stock_transactions: 'id',
  attendance_bonus_rules: 'id',
  attendance_bonus_calculations: 'id',
  sewing_daily_target_rules: 'id',
  attendance_bonus_audit_logs: 'id',
};

// SQL Translation for PostgreSQL compatibility
export function translateSql(rawSql: string, params: any[]): { sql: string; params: any[] } {
  let sql = rawSql.trim();

  // 1. Check for PRAGMA table_info("table") or PRAGMA table_info(table)
  const pragmaMatch = sql.match(/^PRAGMA\s+table_info\s*\(\s*['"]?([a-zA-Z0-9_]+)['"]?\s*\)/i);
  if (pragmaMatch) {
    const tableName = pragmaMatch[1].toLowerCase();
    const pgPragmaSql = `
      SELECT 
        ordinal_position - 1 AS cid,
        column_name AS name,
        data_type AS type,
        CASE WHEN is_nullable = 'NO' THEN 1 ELSE 0 END AS notnull,
        column_default AS dflt_value,
        0 AS pk
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND lower(table_name) = $1
      ORDER BY ordinal_position
    `;
    return { sql: pgPragmaSql, params: [tableName] };
  }

  // 2. Ignore other PRAGMAs (journal_mode, foreign_keys, synchronous, etc.)
  if (/^PRAGMA\s+/i.test(sql)) {
    return { sql: 'SELECT 1 as pragma_noop', params: [] };
  }

  // 3. Translate sqlite_master table queries
  sql = sql.replace(
    /FROM\s+sqlite_master\s+WHERE\s+type\s*=\s*['"]table['"]\s+AND\s+name\s+NOT\s+LIKE\s+['"]sqlite_%['"]/gi,
    "FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'"
  );
  sql = sql.replace(/\bsqlite_master\b/gi, 'information_schema.tables');

  // 4. Translate INSERT OR IGNORE INTO table ...
  if (/^INSERT\s+OR\s+IGNORE\s+INTO\b/i.test(sql)) {
    sql = sql.replace(/^INSERT\s+OR\s+IGNORE\s+INTO\b/i, 'INSERT INTO');
    if (!/ON\s+CONFLICT/i.test(sql)) {
      sql = `${sql} ON CONFLICT DO NOTHING`;
    }
  }

  // 5. Translate INSERT OR REPLACE INTO table (cols) VALUES (vals)
  const replaceMatch = sql.match(/^INSERT\s+OR\s+REPLACE\s+INTO\s+([a-zA-Z0-9_"]+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
  if (replaceMatch) {
    const rawTable = replaceMatch[1].replace(/["`]/g, '');
    const colsStr = replaceMatch[2];
    const valsStr = replaceMatch[3];
    const tableKey = rawTable.toLowerCase();
    const conflictTarget = CONFLICT_KEYS[tableKey] || 'id';

    const cols = colsStr.split(',').map((c) => c.trim().replace(/["`]/g, ''));
    const conflictColList = conflictTarget.split(',').map((c) => c.trim());

    // Update columns are those not in the conflict target
    const updateCols = cols.filter((c) => !conflictColList.includes(c));
    const setClause = updateCols.length > 0
      ? updateCols.map((c) => `"${c}" = EXCLUDED."${c}"`).join(', ')
      : 'id = EXCLUDED.id';

    sql = `INSERT INTO "${rawTable}" (${cols.map((c) => `"${c}"`).join(', ')}) VALUES (${valsStr}) ON CONFLICT (${conflictTarget}) DO UPDATE SET ${setClause}`;
  }

  // 5b. Translate SQLite datetime/date functions and constraints
  sql = sql.replace(/DEFAULT\s*\(\s*datetime\s*\(\s*['"]now['"]\s*\)\s*\)/gi, "DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')");
  sql = sql.replace(/DEFAULT\s+datetime\s*\(\s*['"]now['"]\s*\)/gi, "DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')");
  sql = sql.replace(/DEFAULT\s*\(\s*date\s*\(\s*['"]now['"]\s*\)\s*\)/gi, "DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD')");
  sql = sql.replace(/DEFAULT\s+date\s*\(\s*['"]now['"]\s*\)/gi, "DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD')");
  sql = sql.replace(/\bdatetime\s*\(\s*['"]now['"]\s*\)/gi, "TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')");
  sql = sql.replace(/\bdate\s*\(\s*['"]now['"]\s*\)/gi, "TO_CHAR(NOW(), 'YYYY-MM-DD')");

  // 6. Handle named vs positional parameters
  let finalParams: any[] = [];
  const isNamedObject =
    params.length === 1 &&
    params[0] !== null &&
    typeof params[0] === 'object' &&
    !Array.isArray(params[0]) &&
    !(params[0] instanceof Date) &&
    !(params[0] instanceof Uint8Array);

  if (isNamedObject) {
    const obj = params[0];
    let paramIndex = 0;
    // Replace @key, :key, or $key with $1, $2, ... outside string literals
    let inQuote = false;
    let quoteChar = '';
    let translated = '';

    for (let i = 0; i < sql.length; i++) {
      const ch = sql[i];
      if (!inQuote && (ch === "'" || ch === '"')) {
        inQuote = true;
        quoteChar = ch;
        translated += ch;
      } else if (inQuote && ch === quoteChar) {
        if (sql[i + 1] === quoteChar) {
          translated += ch + sql[i + 1];
          i++;
        } else {
          inQuote = false;
          translated += ch;
        }
      } else if (!inQuote && (ch === '@' || ch === ':' || ch === '$')) {
        const rest = sql.slice(i + 1);
        const match = rest.match(/^[a-zA-Z0-9_]+/);
        if (match) {
          const key = match[0];
          paramIndex++;
          finalParams.push(obj[key] !== undefined ? obj[key] : null);
          translated += `$${paramIndex}`;
          i += key.length;
        } else {
          translated += ch;
        }
      } else {
        translated += ch;
      }
    }
    sql = translated;
  } else {
    // Positional ? parameters
    let paramIndex = 0;
    let inQuote = false;
    let quoteChar = '';
    let translated = '';

    for (let i = 0; i < sql.length; i++) {
      const ch = sql[i];
      if (!inQuote && (ch === "'" || ch === '"')) {
        inQuote = true;
        quoteChar = ch;
        translated += ch;
      } else if (inQuote && ch === quoteChar) {
        if (sql[i + 1] === quoteChar) {
          translated += ch + sql[i + 1];
          i++;
        } else {
          inQuote = false;
          translated += ch;
        }
      } else if (!inQuote && ch === '?') {
        paramIndex++;
        translated += `$${paramIndex}`;
      } else {
        translated += ch;
      }
    }
    sql = translated;
    finalParams = params.map((p) => (p === undefined ? null : p));
  }

  // 7. Case-insensitive LIKE -> ILIKE for PostgreSQL
  let inQuote = false;
  let quoteChar = '';
  let finalSql = '';
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (!inQuote && (ch === "'" || ch === '"')) {
      inQuote = true;
      quoteChar = ch;
      finalSql += ch;
    } else if (inQuote && ch === quoteChar) {
      if (sql[i + 1] === quoteChar) {
        finalSql += ch + sql[i + 1];
        i++;
      } else {
        inQuote = false;
        finalSql += ch;
      }
    } else if (!inQuote && sql.substring(i, i + 5).toUpperCase() === 'LIKE ' && (i === 0 || /\s/.test(sql[i - 1]))) {
      finalSql += 'ILIKE ';
      i += 4;
    } else {
      finalSql += ch;
    }
  }

  // 8. Auto-complete GROUP BY clauses with joined table columns in PostgreSQL
  if (/GROUP\s+BY\s+d\.id\b/i.test(finalSql) && /LEFT\s+JOIN\s+employees\s+m/i.test(finalSql) && !/GROUP\s+BY[^\n]+m\.first_name/i.test(finalSql)) {
    finalSql = finalSql.replace(/GROUP\s+BY\s+d\.id\b/gi, 'GROUP BY d.id, m.first_name, m.last_name, m.khmer_name, m.role, m.avatar');
  }
  if (/GROUP\s+BY\s+j\.id\b/i.test(finalSql) && /LEFT\s+JOIN\s+departments\s+d/i.test(finalSql) && !/GROUP\s+BY[^\n]+d\.name/i.test(finalSql)) {
    finalSql = finalSql.replace(/GROUP\s+BY\s+j\.id\b/gi, 'GROUP BY j.id, d.name');
  }

  return { sql: finalSql, params: finalParams };
}

// Background Worker Code running synchronous PostgreSQL commands
const WORKER_SCRIPT = `
const { workerData } = require('worker_threads');
const { Pool, types } = require('pg');

// Parse int8 (bigint/counts) as native JavaScript numbers
types.setTypeParser(20, (val) => (val === null ? null : parseInt(val, 10)));
// Parse numeric as floating point numbers
types.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val)));

const { stateSab, dataSab, connectionString } = workerData;
const state = new Int32Array(stateSab);
const data = new Uint8Array(dataSab);
const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
});
pool.on('error', (err) => {
  console.warn('[PG Pool Warning]:', err.message);
});

async function initCompatibility() {
  try {
    const client = await pool.connect();
    await client.query(\`
      CREATE OR REPLACE FUNCTION instr(text, text) RETURNS integer AS \\\$\\\$ SELECT POSITION(\$2 IN \$1); \\\$\\\$ LANGUAGE SQL IMMUTABLE;
      CREATE OR REPLACE FUNCTION datetime(VARIADIC text[]) RETURNS text AS \\\$\\\$ SELECT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'); \\\$\\\$ LANGUAGE SQL STABLE;
      CREATE OR REPLACE FUNCTION datetime(text) RETURNS text AS \\\$\\\$ SELECT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'); \\\$\\\$ LANGUAGE SQL STABLE;
      CREATE OR REPLACE FUNCTION datetime() RETURNS text AS \\\$\\\$ SELECT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'); \\\$\\\$ LANGUAGE SQL STABLE;
      CREATE OR REPLACE FUNCTION date(VARIADIC text[]) RETURNS text AS \\\$\\\$ SELECT TO_CHAR(NOW(), 'YYYY-MM-DD'); \\\$\\\$ LANGUAGE SQL STABLE;
      CREATE OR REPLACE FUNCTION date(text) RETURNS text AS \\\$\\\$ SELECT TO_CHAR(NOW(), 'YYYY-MM-DD'); \\\$\\\$ LANGUAGE SQL STABLE;
      CREATE OR REPLACE FUNCTION date() RETURNS text AS \\\$\\\$ SELECT TO_CHAR(NOW(), 'YYYY-MM-DD'); \\\$\\\$ LANGUAGE SQL STABLE;
    \`);
    client.release();
  } catch (err) {
    console.error('[PG Worker] Init compatibility warning:', err.message);
  }
}

async function loop() {
  await initCompatibility();

  while (true) {
    Atomics.wait(state, 0, 0);
    if (Atomics.load(state, 0) !== 1) continue;

    const reqLen = Atomics.load(state, 1);
    const reqBytes = data.subarray(0, reqLen);
    const reqJson = Buffer.from(reqBytes).toString('utf8');
    const req = JSON.parse(reqJson);

    try {
      if (req.type === 'exec') {
        await pool.query(req.sql);
        const resBuf = Buffer.from(JSON.stringify({ success: true }), 'utf8');
        data.set(resBuf, 0);
        Atomics.store(state, 2, resBuf.length);
        Atomics.store(state, 0, 2);
      } else {
        const res = await pool.query(req.sql, req.params);
        const resBuf = Buffer.from(
          JSON.stringify({
            rows: res.rows,
            rowCount: res.rowCount || 0,
          }),
          'utf8'
        );
        data.set(resBuf, 0);
        Atomics.store(state, 2, resBuf.length);
        Atomics.store(state, 0, 2);
      }
    } catch (err) {
      const errBuf = Buffer.from(JSON.stringify({ error: err.message, sql: req.sql }), 'utf8');
      data.set(errBuf, 0);
      Atomics.store(state, 2, errBuf.length);
      Atomics.store(state, 0, 3);
    }
    Atomics.notify(state, 0, 1);
  }
}

loop().catch(console.error);
`;

export class PostgresDatabase {
  private worker: Worker;
  private state: Int32Array;
  private data: Uint8Array;
  private inTransaction: boolean = false;

  constructor(connectionString: string = process.env.DATABASE_URL || DEFAULT_DATABASE_URL) {
    const stateSab = new SharedArrayBuffer(16);
    // 32MB payload buffer for query results
    const dataSab = new SharedArrayBuffer(32 * 1024 * 1024);
    this.state = new Int32Array(stateSab);
    this.data = new Uint8Array(dataSab);

    this.worker = new Worker(WORKER_SCRIPT, {
      eval: true,
      workerData: { stateSab, dataSab, connectionString },
    });

    // Prevent worker from keeping process open indefinitely if main thread closes
    this.worker.unref();

    // Warm-up query
    try {
      this.queryRaw('SELECT 1');
    } catch (e) {
      // initial query may warm up
    }
  }

  private queryRaw(sql: string, params: any[] = []): { rows: any[]; rowCount: number } {
    const reqBuf = Buffer.from(JSON.stringify({ type: 'query', sql, params }), 'utf8');
    this.data.set(reqBuf, 0);
    Atomics.store(this.state, 1, reqBuf.length);
    Atomics.store(this.state, 0, 1);
    Atomics.notify(this.state, 0, 1);

    Atomics.wait(this.state, 0, 1);
    const status = Atomics.load(this.state, 0);
    const resLen = Atomics.load(this.state, 2);
    const resJson = Buffer.from(this.data.subarray(0, resLen)).toString('utf8');
    Atomics.store(this.state, 0, 0);

    const result = JSON.parse(resJson);
    if (status === 3) {
      const err = new Error(result.error);
      (err as any).sql = result.sql;
      throw err;
    }
    return result;
  }

  public prepare<T = any>(sql: string): Statement<T> {
    return {
      all: (...params: any[]): T[] => {
        const { sql: translatedSql, params: finalParams } = translateSql(sql, params);
        const res = this.queryRaw(translatedSql, finalParams);
        return res.rows as T[];
      },
      get: (...params: any[]): T | undefined => {
        const { sql: translatedSql, params: finalParams } = translateSql(sql, params);
        const res = this.queryRaw(translatedSql, finalParams);
        return (res.rows[0] as T) || undefined;
      },
      run: (...params: any[]): RunResult => {
        const { sql: translatedSql, params: finalParams } = translateSql(sql, params);
        const res = this.queryRaw(translatedSql, finalParams);
        return {
          changes: res.rowCount,
          lastInsertRowid: 0,
        };
      },
    };
  }

  public exec(sql: string): void {
    const reqBuf = Buffer.from(JSON.stringify({ type: 'exec', sql }), 'utf8');
    this.data.set(reqBuf, 0);
    Atomics.store(this.state, 1, reqBuf.length);
    Atomics.store(this.state, 0, 1);
    Atomics.notify(this.state, 0, 1);

    Atomics.wait(this.state, 0, 1);
    const status = Atomics.load(this.state, 0);
    const resLen = Atomics.load(this.state, 2);
    const resJson = Buffer.from(this.data.subarray(0, resLen)).toString('utf8');
    Atomics.store(this.state, 0, 0);

    const result = JSON.parse(resJson);
    if (status === 3) {
      throw new Error(result.error);
    }
  }

  public transaction<T extends (...args: any[]) => any>(fn: T): T {
    return ((...args: any[]) => {
      const isNested = this.inTransaction;
      if (!isNested) {
        this.inTransaction = true;
        this.queryRaw('BEGIN');
      } else {
        this.queryRaw('SAVEPOINT sp_nested');
      }

      try {
        const result = fn(...args);
        if (!isNested) {
          this.queryRaw('COMMIT');
          this.inTransaction = false;
        } else {
          this.queryRaw('RELEASE SAVEPOINT sp_nested');
        }
        return result;
      } catch (err) {
        if (!isNested) {
          this.queryRaw('ROLLBACK');
          this.inTransaction = false;
        } else {
          this.queryRaw('ROLLBACK TO SAVEPOINT sp_nested');
        }
        throw err;
      }
    }) as T;
  }

  public pragma(pragmaSql: string): any {
    // No-op for WAL, foreign keys, etc.
    return [];
  }

  public async backup(destPath: string): Promise<void> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    const connStr = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
    await execAsync(`pg_dump "${connStr}" -f "${destPath}"`);
  }

  public close(): void {
    this.worker.terminate();
  }
}

let globalDb: PostgresDatabase | null = null;

export function getPostgresDb(): PostgresDatabase {
  if (!globalDb) {
    globalDb = new PostgresDatabase();
  }
  return globalDb;
}
