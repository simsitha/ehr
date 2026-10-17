import { NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';
import { computeSewingWeeklyBonus } from '@/lib/bonusEngine';
import { SewingBonusRule, SewingWeeklyProduction } from '@/lib/types';

export const dynamic = 'force-dynamic';

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || '2026-10';
    const weekStart = searchParams.get('weekStart');
    const groupName = searchParams.get('group');

    const db = getDb();

    let query = `
      SELECT s.*, 
             e.first_name || ' ' || e.last_name as employee_name,
             e.khmer_name
      FROM sewing_production_weekly s
      LEFT JOIN employees e ON s.employee_id = e.id
      WHERE (s.month = ? OR s.week_start LIKE ?)
    `;
    const params: any[] = [month, `${month}%`];

    if (weekStart) {
      query += ` AND s.week_start = ?`;
      params.push(weekStart);
    }

    if (groupName && groupName !== 'all') {
      const gNorm = groupName.toLowerCase().replace(/[\s_.-]+/g, '');
      if (gNorm === '1' || gNorm === 'l1' || gNorm === 'line1' || gNorm === 'sewl1' || gNorm === 'b1' || gNorm === 'batch1' || gNorm === 'sewingline1') {
        query += ` AND (s.group_name = 'Sewing Line 1' OR s.group_name = 'Sew-L.1' OR s.group_name = 'B1' OR s.group_name = 'Line 1')`;
      } else if (gNorm === '2' || gNorm === 'l2' || gNorm === 'line2' || gNorm === 'sewl2' || gNorm === 'b2' || gNorm === 'batch2' || gNorm === 'sewingline2') {
        query += ` AND (s.group_name = 'Sewing Line 2' OR s.group_name = 'Sew-L.2' OR s.group_name = 'B2' OR s.group_name = 'Line 2')`;
      } else if (gNorm === '3' || gNorm === 'l3' || gNorm === 'line3' || gNorm === 'sewl3' || gNorm === 'b3' || gNorm === 'batch3' || gNorm === 'sewingline3') {
        query += ` AND (s.group_name = 'Sewing Line 3' OR s.group_name = 'Sew-L.3' OR s.group_name = 'B3' OR s.group_name = 'Line 3')`;
      } else {
        query += ` AND s.group_name = ?`;
        params.push(groupName);
      }
    }

    query += ` ORDER BY s.week_number ASC, s.group_name ASC, s.employee_id ASC`;

    const records = db.prepare(query).all(...params) as SewingWeeklyProduction[];

    // Load active sewing rules
    const rules = db.prepare('SELECT * FROM sewing_bonus_rules WHERE is_active = 1').all() as SewingBonusRule[];

    // Summary stats
    const totalQty = records.reduce((acc, r) => acc + r.total_qty, 0);
    const totalBonus = records.reduce((acc, r) => acc + r.bonus_amount, 0);
    const avgAchievement = records.length > 0 ? Math.round(records.reduce((acc, r) => acc + r.achievement_pct, 0) / records.length * 10) / 10 : 0;

    return NextResponse.json({
      records,
      rules,
      summary: {
        total_records: records.length,
        total_quantity: totalQty,
        total_bonus_payout: totalBonus,
        average_achievement_pct: avgAchievement,
      },
    });
  } catch (error: any) {
    console.error('Error fetching sewing weekly production:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const rule = db.prepare('SELECT * FROM sewing_bonus_rules WHERE is_active = 1 LIMIT 1').get() as SewingBonusRule | undefined;

    const upsertStmt = db.prepare(`
      INSERT INTO sewing_production_weekly (
        id, week_number, week_start, week_end, month, employee_id, group_name,
        mon_qty, tue_qty, wed_qty, thu_qty, fri_qty, sat_qty,
        total_qty, target_qty, achievement_pct, bonus_amount, status, notes, created_at
      ) VALUES (
        @id, @week_number, @week_start, @week_end, @monthVal, @employee_id, @group_name,
        @mon_qty, @tue_qty, @wed_qty, @thu_qty, @fri_qty, @sat_qty,
        @total_qty, @target_qty, @achievementPct, @bonusAmount, @status, @notes, TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
      )
      ON CONFLICT(week_start, employee_id) DO UPDATE SET
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

    // Special batch populate action
    if (body.action === 'populate_lines' || body.action === 'generate_lines') {
      const targetLines = body.line ? [body.line] : ['Sewing Line 1', 'Sewing Line 2'];
      const targetMonth = body.month || '2026-10';
      const weeks = [
        { week_number: 40, week_start: `${targetMonth}-05`, week_end: `${targetMonth}-10` },
        { week_number: 41, week_start: `${targetMonth}-12`, week_end: `${targetMonth}-17` },
        { week_number: 42, week_start: `${targetMonth}-19`, week_end: `${targetMonth}-24` },
        { week_number: 43, week_start: `${targetMonth}-26`, week_end: `${targetMonth}-31` },
      ];

      let generatedCount = 0;
      for (const lineName of targetLines) {
        const workers = db.prepare(
          "SELECT id, first_name, last_name, group_name FROM employees WHERE group_name = ? OR group_name = ?"
        ).all(lineName, lineName === 'Sewing Line 1' ? 'Sew-L.1' : 'Sew-L.2') as any[];

        for (const worker of workers) {
          for (let wIdx = 0; wIdx < weeks.length; wIdx++) {
            const w = weeks[wIdx];
            const seed = (worker.id.charCodeAt(worker.id.length - 1) + wIdx * 7) % 10;
            let dailyBase = 210;
            if (seed >= 7) dailyBase = 240; // Tier 3
            else if (seed >= 4) dailyBase = 225; // Tier 2
            else if (seed >= 1) dailyBase = 212; // Tier 1
            else dailyBase = 190; // Base

            const mon = dailyBase + ((seed * 3) % 7) - 3;
            const tue = dailyBase + ((seed * 5) % 9) - 4;
            const wed = dailyBase + ((seed * 2) % 6) - 2;
            const thu = dailyBase + ((seed * 4) % 8) - 3;
            const fri = dailyBase + ((seed * 6) % 10) - 4;
            const sat = dailyBase + ((seed * 7) % 7) - 3;
            const total_qty = mon + tue + wed + thu + fri + sat;
            const target_qty = 1200;

            const { achievementPct, bonusAmount } = computeSewingWeeklyBonus(total_qty, rule);

            upsertStmt.run({
              id: `spw-w${w.week_number}-${worker.id}`,
              week_number: w.week_number,
              week_start: w.week_start,
              week_end: w.week_end,
              monthVal: targetMonth,
              employee_id: worker.id,
              group_name: lineName,
              mon_qty: mon,
              tue_qty: tue,
              wed_qty: wed,
              thu_qty: thu,
              fri_qty: fri,
              sat_qty: sat,
              total_qty,
              target_qty,
              achievementPct,
              bonusAmount,
              status: 'Approved',
              notes: `${lineName} Week ${w.week_number} production log`,
            });
            generatedCount++;
          }
        }
      }

      logAudit({
        user_id: 'usr-admin',
        user_name: 'Administrator',
        action: 'POPULATE_SEWING_WEEKLY_OUTPUT',
        module: 'Bonus Engine',
        record_id: `batch-${generatedCount}`,
        new_value: JSON.stringify({ lines: targetLines, count: generatedCount, month: targetMonth }),
      });

      return NextResponse.json({
        success: true,
        message: `Successfully populated ${generatedCount} output logs for ${targetLines.join(' and ')}`,
        count: generatedCount,
      });
    }

    const rows = Array.isArray(body.records) ? body.records : [body];
    const savedRecords: any[] = [];

    for (const item of rows) {
      const {
        id,
        week_number,
        week_start,
        week_end,
        month,
        employee_id,
        group_name: rawGroupName,
        mon_qty = 0,
        tue_qty = 0,
        wed_qty = 0,
        thu_qty = 0,
        fri_qty = 0,
        sat_qty = 0,
        target_qty = 1200,
        status = 'Approved',
        notes,
      } = item;

      if (!week_start || !employee_id) continue;

      const group_name = normalizeSewingGroup(rawGroupName);
      const m = Number(mon_qty) || 0;
      const tu = Number(tue_qty) || 0;
      const w = Number(wed_qty) || 0;
      const th = Number(thu_qty) || 0;
      const f = Number(fri_qty) || 0;
      const sa = Number(sat_qty) || 0;
      const total_qty = m + tu + w + th + f + sa;

      const { achievementPct, bonusAmount } = computeSewingWeeklyBonus(total_qty, rule);
      const recordId = id || `spw-${week_number || 40}-${employee_id}`;
      const monthVal = month || week_start.substring(0, 7);

      upsertStmt.run({
        id: recordId,
        week_number: Number(week_number) || 40,
        week_start,
        week_end: week_end || week_start,
        monthVal,
        employee_id,
        group_name,
        mon_qty: m,
        tue_qty: tu,
        wed_qty: w,
        thu_qty: th,
        fri_qty: f,
        sat_qty: sa,
        total_qty,
        target_qty: Number(target_qty) || 1200,
        achievementPct,
        bonusAmount,
        status,
        notes: notes || null,
      });

      savedRecords.push({
        id: recordId,
        employee_id,
        group_name,
        total_qty,
        achievement_pct: achievementPct,
        bonus_amount: bonusAmount,
      });
    }

    logAudit({
      user_id: 'usr-admin',
      user_name: 'Administrator',
      action: 'SAVE_SEWING_PRODUCTION',
      module: 'Bonus Engine',
      record_id: `batch-${savedRecords.length}`,
      new_value: JSON.stringify({ count: savedRecords.length }),
    });

    return NextResponse.json({
      success: true,
      count: savedRecords.length,
      records: savedRecords,
      record: savedRecords[0] || null,
    });
  } catch (error: any) {
    console.error('Error saving sewing production:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Production record id is required' }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare('SELECT * FROM sewing_production_weekly WHERE id = ?').get(id) as any;
    if (!existing) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    db.prepare('DELETE FROM sewing_production_weekly WHERE id = ?').run(id);

    logAudit({
      user_id: 'usr-admin',
      user_name: 'Administrator',
      action: 'DELETE_SEWING_PRODUCTION',
      module: 'Bonus Engine',
      record_id: id,
      old_value: JSON.stringify(existing),
    });

    return NextResponse.json({ success: true, message: 'Production record deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting sewing production record:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

