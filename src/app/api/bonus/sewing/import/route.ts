import { NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';
import { computeSewingWeeklyBonus } from '@/lib/bonusEngine';
import { SewingBonusRule, SewingWeeklyProduction } from '@/lib/types';
import { parseDateToISO } from '@/lib/translations';

export const dynamic = 'force-dynamic';

function cleanNum(val: any): number {
  if (val === undefined || val === null) return 0;
  const s = String(val).trim().replace(/[$៛, ]/g, '');
  if (!s || s === '-' || s === '$-') return 0;
  const n = parseFloat(s);
  return isNaN(n) ? 0 : Math.max(0, Math.round(n));
}

function normalizeSewingGroup(val?: string): string {
  if (!val) return 'Sewing Line 1';
  const clean = val.trim();
  const lower = clean.toLowerCase().replace(/[\s_.-]+/g, '');
  if (lower === '1' || lower === 'l1' || lower === 'line1' || lower === 'sewl1' || lower === 'b1' || lower === 'batch1' || lower === 'sewingline1') {
    return 'Sewing Line 1';
  }
  if (lower === '2' || lower === 'l2' || lower === 'line2' || lower === 'sewl2' || lower === 'b2' || lower === 'batch2' || lower === 'sewingline2') {
    return 'Sewing Line 2';
  }
  if (lower === '3' || lower === 'l3' || lower === 'line3' || lower === 'sewl3' || lower === 'b3' || lower === 'batch3' || lower === 'sewingline3') {
    return 'Sewing Line 3';
  }
  return clean;
}

// RFC 4180 client/server CSV & TSV parser
function parseRawDelimited(rawText: string): Record<string, string>[] {
  const cleanText = rawText.replace(/^\uFEFF/, '').trim();
  if (!cleanText) return [];

  // Determine delimiter: tab or comma
  const firstLine = cleanText.split(/\r?\n/)[0] || '';
  const isTSV = firstLine.includes('\t') && !firstLine.includes(',');
  const delimiter = isTSV ? '\t' : ',';

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"' && !isTSV) {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentField.trim());
      if (currentRow.some((f) => f.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length < 2) return [];

  const rawHeaders = rows[0];
  const headers = rawHeaders.map((h) =>
    h.toLowerCase().trim().replace(/[\s_-]+/g, '')
  );

  const result: Record<string, string>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || row.every((c) => !c)) continue;
    const item: Record<string, string> = {};
    headers.forEach((header, idx) => {
      item[header] = row[idx] !== undefined ? row[idx].trim() : '';
    });
    result.push(item);
  }

  return result;
}

export async function GET() {
  try {
    const db = getDb();
    const rules = db.prepare('SELECT * FROM sewing_bonus_rules WHERE is_active = 1').all() as SewingBonusRule[];
    return NextResponse.json({
      success: true,
      rules,
      sampleTemplate: [
        {
          employee_id: 'HC004',
          group_name: 'Sew-L.3',
          week_number: 40,
          week_start: '2026-10-05',
          week_end: '2026-10-10',
          mon_qty: 210,
          tue_qty: 232,
          wed_qty: 210,
          thu_qty: 227,
          fri_qty: 220,
          sat_qty: 202,
          target_qty: 1200,
          notes: 'Met tier 1 weekly target',
        },
        {
          employee_id: 'HC007',
          group_name: 'Sew-L.2',
          week_number: 40,
          week_start: '2026-10-05',
          week_end: '2026-10-10',
          mon_qty: 225,
          tue_qty: 235,
          wed_qty: 220,
          thu_qty: 230,
          fri_qty: 225,
          sat_qty: 210,
          target_qty: 1200,
          notes: 'Met tier 2 weekly target',
        },
      ],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const {
      rows: rawInputRows,
      csvText,
      defaultMonth = '2026-10',
      defaultWeekNumber = 40,
      defaultWeekStart = '2026-10-05',
      defaultWeekEnd = '2026-10-10',
      commit = true,
    } = body;

    let parsedItems: any[] = [];

    if (Array.isArray(rawInputRows) && rawInputRows.length > 0) {
      parsedItems = rawInputRows;
    } else if (typeof csvText === 'string' && csvText.trim()) {
      const records = parseRawDelimited(csvText);
      parsedItems = records.map((rec) => {
        // Find fields by alias
        const getVal = (...keys: string[]) => {
          for (const k of keys) {
            const norm = k.toLowerCase().replace(/[\s_-]+/g, '');
            if (rec[norm] !== undefined && rec[norm] !== '') return rec[norm];
          }
          return '';
        };

        return {
          employee_id: getVal('employee_id', 'employeeid', 'empid', 'id', 'worker_id', 'code'),
          group_name: getVal('group_name', 'group', 'line', 'sewing_line', 'line_name', 'batch', 'batch_code', 'batch_name', 'b'),
          week_number: cleanNum(getVal('week_number', 'week_num', 'week', 'w')) || defaultWeekNumber,
          week_start: parseDateToISO(getVal('week_start', 'start_date', 'date_from', 'weekstart')) || getVal('week_start', 'start_date', 'date_from', 'weekstart') || defaultWeekStart,
          week_end: parseDateToISO(getVal('week_end', 'end_date', 'date_to', 'weekend')) || getVal('week_end', 'end_date', 'date_to', 'weekend') || defaultWeekEnd,
          mon_qty: cleanNum(getVal('mon_qty', 'mon', 'monday', 'm')),
          tue_qty: cleanNum(getVal('tue_qty', 'tue', 'tuesday', 'tu')),
          wed_qty: cleanNum(getVal('wed_qty', 'wed', 'wednesday', 'w_qty')),
          thu_qty: cleanNum(getVal('thu_qty', 'thu', 'thursday', 'th')),
          fri_qty: cleanNum(getVal('fri_qty', 'fri', 'friday', 'f')),
          sat_qty: cleanNum(getVal('sat_qty', 'sat', 'saturday', 's')),
          target_qty: cleanNum(getVal('target_qty', 'target', 'target_pieces')) || 1200,
          status: getVal('status') || 'Approved',
          notes: getVal('notes', 'note', 'remark', 'remarks', 'comment') || '',
        };
      });
    }

    if (parsedItems.length === 0) {
      return NextResponse.json({ error: 'No valid production rows provided to import.' }, { status: 400 });
    }

    // Load active sewing rules
    const rule = db.prepare('SELECT * FROM sewing_bonus_rules WHERE is_active = 1 LIMIT 1').get() as SewingBonusRule | undefined;

    // Load all employees into Map for fast lookup & validation
    const employeesList = db.prepare(`
      SELECT id, first_name, last_name, khmer_name, group_name
      FROM employees
    `).all() as { id: string; first_name: string; last_name: string; khmer_name: string | null; group_name: string | null }[];

    const empMap = new Map<string, { id: string; name: string; khmer_name: string; group_name: string }>();
    for (const e of employeesList) {
      empMap.set(e.id.toUpperCase(), {
        id: e.id,
        name: `${e.first_name} ${e.last_name}`.trim(),
        khmer_name: e.khmer_name || '',
        group_name: e.group_name || 'Sew-L.1',
      });
    }

    // Process and enrich rows
    const processedRows: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < parsedItems.length; i++) {
      const item = parsedItems[i];
      const rawEmpId = String(item.employee_id || '').trim().toUpperCase();
      if (!rawEmpId) {
        errors.push(`Row ${i + 1}: Missing Employee ID.`);
        continue;
      }

      const emp = empMap.get(rawEmpId);
      const employee_id = emp ? emp.id : rawEmpId;
      const employee_name = emp ? emp.name : 'Unknown Employee';
      const khmer_name = emp ? emp.khmer_name : '';
      const group_name = normalizeSewingGroup(item.group_name || (emp ? emp.group_name : 'Sew-L.1'));

      const week_number = cleanNum(item.week_number) || defaultWeekNumber;
      const week_start = parseDateToISO(item.week_start) || item.week_start || defaultWeekStart;
      const week_end = parseDateToISO(item.week_end) || item.week_end || defaultWeekEnd;
      const month = item.month || week_start.substring(0, 7) || defaultMonth;

      const mon_qty = cleanNum(item.mon_qty);
      const tue_qty = cleanNum(item.tue_qty);
      const wed_qty = cleanNum(item.wed_qty);
      const thu_qty = cleanNum(item.thu_qty);
      const fri_qty = cleanNum(item.fri_qty);
      const sat_qty = cleanNum(item.sat_qty);

      const computedTotal = mon_qty + tue_qty + wed_qty + thu_qty + fri_qty + sat_qty;
      const total_qty = item.total_qty && item.total_qty > 0 && computedTotal === 0
        ? cleanNum(item.total_qty)
        : computedTotal;

      const target_qty = cleanNum(item.target_qty) || 1200;

      const { achievementPct, bonusAmount } = computeSewingWeeklyBonus(total_qty, {
        weekly_target_qty: target_qty,
        ...rule,
      });

      const recordId = item.id || `spw-${week_number}-${employee_id}`;
      const status = item.status || 'Approved';
      const notes = item.notes || `Imported weekly sewing output (${achievementPct}%)`;

      processedRows.push({
        id: recordId,
        week_number,
        week_start,
        week_end,
        month,
        employee_id,
        employee_name,
        khmer_name,
        group_name,
        mon_qty,
        tue_qty,
        wed_qty,
        thu_qty,
        fri_qty,
        sat_qty,
        total_qty,
        target_qty,
        achievement_pct: achievementPct,
        bonus_amount: bonusAmount,
        status,
        notes,
        isExistingEmployee: Boolean(emp),
      });
    }

    if (processedRows.length === 0) {
      return NextResponse.json({
        error: 'No valid records found in import data.',
        details: errors,
      }, { status: 400 });
    }

    const totalQuantity = processedRows.reduce((sum, r) => sum + r.total_qty, 0);
    const totalBonus = processedRows.reduce((sum, r) => sum + r.bonus_amount, 0);

    // If dry run (commit = false), return preview
    if (!commit) {
      return NextResponse.json({
        success: true,
        preview: true,
        count: processedRows.length,
        total_quantity: totalQuantity,
        total_bonus: totalBonus,
        rows: processedRows,
        warnings: errors,
      });
    }

    // Execute SQLite transaction for batch upsert
    let inserted = 0;
    let updated = 0;

    const upsertStmt = db.prepare(`
      INSERT INTO sewing_production_weekly (
        id, week_number, week_start, week_end, month, employee_id, group_name,
        mon_qty, tue_qty, wed_qty, thu_qty, fri_qty, sat_qty,
        total_qty, target_qty, achievement_pct, bonus_amount, status, notes, created_at
      ) VALUES (
        @id, @week_number, @week_start, @week_end, @month, @employee_id, @group_name,
        @mon_qty, @tue_qty, @wed_qty, @thu_qty, @fri_qty, @sat_qty,
        @total_qty, @target_qty, @achievement_pct, @bonus_amount, @status, @notes, TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
      )
      ON CONFLICT(week_start, employee_id) DO UPDATE SET
        week_number = excluded.week_number,
        week_end = excluded.week_end,
        month = excluded.month,
        group_name = excluded.group_name,
        mon_qty = excluded.mon_qty,
        tue_qty = excluded.tue_qty,
        wed_qty = excluded.wed_qty,
        thu_qty = excluded.thu_qty,
        fri_qty = excluded.fri_qty,
        sat_qty = excluded.sat_qty,
        total_qty = excluded.total_qty,
        target_qty = excluded.target_qty,
        achievement_pct = excluded.achievement_pct,
        bonus_amount = excluded.bonus_amount,
        status = excluded.status,
        notes = excluded.notes
    `);

    const checkExistingStmt = db.prepare(`
      SELECT id FROM sewing_production_weekly WHERE week_start = ? AND employee_id = ?
    `);

    const runImport = db.transaction((rows: any[]) => {
      for (const r of rows) {
        const existing = checkExistingStmt.get(r.week_start, r.employee_id);
        if (existing) {
          updated++;
        } else {
          inserted++;
        }
        upsertStmt.run(r);
      }
    });

    runImport(processedRows);

    logAudit({
      user_id: 'usr-admin',
      user_name: 'Administrator',
      action: 'IMPORT_SEWING_PRODUCTION_BATCH',
      module: 'Bonus Engine',
      record_id: `batch-${processedRows.length}`,
      new_value: JSON.stringify({
        count: processedRows.length,
        inserted,
        updated,
        totalQuantity,
        totalBonus,
        month: defaultMonth,
      }),
    });

    return NextResponse.json({
      success: true,
      count: processedRows.length,
      inserted,
      updated,
      total_quantity: totalQuantity,
      total_bonus: totalBonus,
      rows: processedRows,
      warnings: errors,
    });
  } catch (error: any) {
    console.error('Error importing sewing production:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
