import { NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';
import { computeDailyTargetBonus, DEFAULT_DAILY_TARGET_RULE, DailyTargetRule, computeSewingWeeklyBonus } from '@/lib/payrollRules';
import { SewingWeeklyProduction } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || '2026-10';
    const weekStart = searchParams.get('weekStart');
    const groupName = searchParams.get('group');
    const search = searchParams.get('search');

    const db = getDb();

    // Ensure sewing_daily_target_rules table exists
    db.prepare(`
      CREATE TABLE IF NOT EXISTS sewing_daily_target_rules (
        id TEXT PRIMARY KEY,
        rule_name TEXT NOT NULL DEFAULT 'Default Daily Target Matrix',
        daily_target_qty INTEGER NOT NULL DEFAULT 200,
        base_min_pct REAL NOT NULL DEFAULT 90.0,
        base_bonus REAL NOT NULL DEFAULT 0.50,
        tier_1_min_pct REAL NOT NULL DEFAULT 100.0,
        tier_1_bonus REAL NOT NULL DEFAULT 1.50,
        tier_2_min_pct REAL NOT NULL DEFAULT 110.0,
        tier_2_bonus REAL NOT NULL DEFAULT 2.50,
        tier_3_min_pct REAL NOT NULL DEFAULT 120.0,
        tier_3_bonus REAL NOT NULL DEFAULT 3.50,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Fetch active daily target rule
    let activeRule = db.prepare('SELECT * FROM sewing_daily_target_rules WHERE is_active = 1 LIMIT 1').get() as DailyTargetRule | undefined;
    if (!activeRule) {
      db.prepare(`
        INSERT INTO sewing_daily_target_rules (
          id, rule_name, daily_target_qty, base_min_pct, base_bonus,
          tier_1_min_pct, tier_1_bonus, tier_2_min_pct, tier_2_bonus,
          tier_3_min_pct, tier_3_bonus, is_active
        ) VALUES (
          'sdtr-default', 'Standard Garment Daily Target Matrix', 200, 90.0, 0.50,
          100.0, 1.50, 110.0, 2.50,
          120.0, 3.50, 1
        )
      `).run();
      activeRule = db.prepare('SELECT * FROM sewing_daily_target_rules WHERE id = ?').get('sdtr-default') as DailyTargetRule;
    }

    const rule: DailyTargetRule = activeRule || DEFAULT_DAILY_TARGET_RULE;

    let query = `
      SELECT s.*, 
             e.first_name || ' ' || e.last_name as employee_name,
             e.khmer_name,
             e.avatar,
             e.role
      FROM sewing_production_weekly s
      LEFT JOIN employees e ON s.employee_id = e.id
      WHERE (s.month = ? OR s.week_start LIKE ?)
    `;
    const params: any[] = [month, `${month}%`];

    if (weekStart && weekStart !== 'all') {
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

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query += ` AND (s.employee_id LIKE ? OR e.first_name LIKE ? OR e.last_name LIKE ? OR e.khmer_name LIKE ? OR s.group_name LIKE ?)`;
      params.push(term, term, term, term, term);
    }

    query += ` ORDER BY s.week_number ASC, s.group_name ASC, s.employee_id ASC`;

    const rawRecords = db.prepare(query).all(...params) as any[];

    // Calculate daily target bonuses for all days Mon-Sat
    let totalDailyBonusPayout = 0;
    let totalTargetDaysMet = 0;
    let totalDaysTracked = 0;
    const tierCounts = { B3: 0, B2: 0, B1: 0, Base: 0, Below: 0 };
    const employeeMonthlyTotals = new Map<string, { total_bonus: number; days_met: number; total_qty: number }>();

    const enhancedRecords = rawRecords.map((r) => {
      const days = [
        { day: 'Mon', qty: r.mon_qty || 0 },
        { day: 'Tue', qty: r.tue_qty || 0 },
        { day: 'Wed', qty: r.wed_qty || 0 },
        { day: 'Thu', qty: r.thu_qty || 0 },
        { day: 'Fri', qty: r.fri_qty || 0 },
        { day: 'Sat', qty: r.sat_qty || 0 },
      ];

      let weeklyDailyBonus = 0;
      let weeklyDaysMet = 0;
      const dailyBreakdown: Record<string, { qty: number; pct: number; bonus: number; tier: string; tierLabel: string }> = {};

      for (const d of days) {
        const res = computeDailyTargetBonus(d.qty, rule);
        dailyBreakdown[d.day.toLowerCase()] = {
          qty: d.qty,
          pct: res.achievementPct,
          bonus: res.bonusAmount,
          tier: res.tier,
          tierLabel: res.tierLabel,
        };

        weeklyDailyBonus += res.bonusAmount;
        totalDaysTracked++;

        if (res.tier === 'B3') {
          tierCounts.B3++;
          weeklyDaysMet++;
        } else if (res.tier === 'B2') {
          tierCounts.B2++;
          weeklyDaysMet++;
        } else if (res.tier === 'B1') {
          tierCounts.B1++;
          weeklyDaysMet++;
        } else if (res.tier === 'Base') {
          tierCounts.Base++;
          weeklyDaysMet++;
        } else {
          tierCounts.Below++;
        }
      }

      totalDailyBonusPayout += weeklyDailyBonus;
      totalTargetDaysMet += weeklyDaysMet;

      // Accumulate monthly totals
      const currentEmp = employeeMonthlyTotals.get(r.employee_id) || { total_bonus: 0, days_met: 0, total_qty: 0 };
      currentEmp.total_bonus = Math.round((currentEmp.total_bonus + weeklyDailyBonus) * 100) / 100;
      currentEmp.days_met += weeklyDaysMet;
      currentEmp.total_qty += (r.total_qty || 0);
      employeeMonthlyTotals.set(r.employee_id, currentEmp);

      return {
        ...r,
        daily_breakdown: dailyBreakdown,
        weekly_daily_bonus: Math.round(weeklyDailyBonus * 100) / 100,
        weekly_days_met: weeklyDaysMet,
        target_days_ratio: `${weeklyDaysMet}/6`,
      };
    });

    // Attach monthly totals to records
    enhancedRecords.forEach((r) => {
      const empTotal = employeeMonthlyTotals.get(r.employee_id);
      r.monthly_daily_bonus = empTotal ? empTotal.total_bonus : r.weekly_daily_bonus;
      r.monthly_days_met = empTotal ? empTotal.days_met : r.weekly_days_met;
    });

    // Unique employees
    const uniqueEmployeesCount = employeeMonthlyTotals.size;
    const avgDailyBonus = uniqueEmployeesCount > 0 ? Math.round((totalDailyBonusPayout / uniqueEmployeesCount) * 100) / 100 : 0;
    const hitRatePct = totalDaysTracked > 0 ? Math.round((totalTargetDaysMet / totalDaysTracked) * 1000) / 10 : 0;

    return NextResponse.json({
      success: true,
      rule,
      records: enhancedRecords,
      summary: {
        total_records: enhancedRecords.length,
        total_workers: uniqueEmployeesCount,
        total_daily_bonus_payout: Math.round(totalDailyBonusPayout * 100) / 100,
        average_bonus_per_worker: avgDailyBonus,
        total_days_tracked: totalDaysTracked,
        total_target_days_met: totalTargetDaysMet,
        hit_rate_pct: hitRatePct,
        tier_distribution: tierCounts,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/bonus/sewing/daily:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();

    const {
      id,
      week_number,
      week_start,
      week_end,
      month,
      employee_id,
      group_name = 'Sewing Line 1',
      mon_qty = 0,
      tue_qty = 0,
      wed_qty = 0,
      thu_qty = 0,
      fri_qty = 0,
      sat_qty = 0,
      notes,
    } = body;

    if (!week_start || !employee_id) {
      return NextResponse.json({ error: 'week_start and employee_id are required' }, { status: 400 });
    }

    const m = Number(mon_qty) || 0;
    const tu = Number(tue_qty) || 0;
    const w = Number(wed_qty) || 0;
    const th = Number(thu_qty) || 0;
    const f = Number(fri_qty) || 0;
    const sa = Number(sat_qty) || 0;
    const total_qty = m + tu + w + th + f + sa;

    const rule = db.prepare('SELECT * FROM sewing_bonus_rules WHERE is_active = 1 LIMIT 1').get() as any;
    const { achievementPct, bonusAmount } = computeSewingWeeklyBonus(total_qty, rule);
    const recordId = id || `spw-w${week_number || 40}-${employee_id}`;
    const monthVal = month || week_start.substring(0, 7);

    db.prepare(`
      INSERT INTO sewing_production_weekly (
        id, week_number, week_start, week_end, month, employee_id, group_name,
        mon_qty, tue_qty, wed_qty, thu_qty, fri_qty, sat_qty,
        total_qty, target_qty, achievement_pct, bonus_amount, status, notes, created_at
      ) VALUES (
        @id, @week_number, @week_start, @week_end, @monthVal, @employee_id, @group_name,
        @mon_qty, @tue_qty, @wed_qty, @thu_qty, @fri_qty, @sat_qty,
        @total_qty, 1200, @achievementPct, @bonusAmount, 'Approved', @notes, TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
      )
      ON CONFLICT(week_start, employee_id) DO UPDATE SET
        mon_qty = excluded.mon_qty,
        tue_qty = excluded.tue_qty,
        wed_qty = excluded.wed_qty,
        thu_qty = excluded.thu_qty,
        fri_qty = excluded.fri_qty,
        sat_qty = excluded.sat_qty,
        total_qty = excluded.total_qty,
        achievement_pct = excluded.achievement_pct,
        bonus_amount = excluded.bonus_amount,
        notes = excluded.notes
    `).run({
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
      achievementPct,
      bonusAmount,
      notes: notes || null,
    });

    logAudit({
      user_id: 'usr-admin',
      user_name: 'Administrator',
      action: 'SAVE_DAILY_PRODUCTION_LOG',
      module: 'Sewing Production',
      record_id: recordId,
      new_value: JSON.stringify({ employee_id, week_start, total_qty }),
    });

    return NextResponse.json({ success: true, message: 'Daily production log saved successfully', id: recordId });
  } catch (error: any) {
    console.error('Error in POST /api/bonus/sewing/daily:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();

    const {
      id = 'sdtr-default',
      rule_name = 'Standard Garment Daily Target Matrix',
      daily_target_qty = 200,
      base_min_pct = 90.0,
      base_bonus = 0.50,
      tier_1_min_pct = 100.0,
      tier_1_bonus = 1.50,
      tier_2_min_pct = 110.0,
      tier_2_bonus = 2.50,
      tier_3_min_pct = 120.0,
      tier_3_bonus = 3.50,
    } = body;

    db.prepare(`
      INSERT INTO sewing_daily_target_rules (
        id, rule_name, daily_target_qty, base_min_pct, base_bonus,
        tier_1_min_pct, tier_1_bonus, tier_2_min_pct, tier_2_bonus,
        tier_3_min_pct, tier_3_bonus, is_active, updated_at
      ) VALUES (
        @id, @rule_name, @daily_target_qty, @base_min_pct, @base_bonus,
        @tier_1_min_pct, @tier_1_bonus, @tier_2_min_pct, @tier_2_bonus,
        @tier_3_min_pct, @tier_3_bonus, 1, TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
      )
      ON CONFLICT(id) DO UPDATE SET
        rule_name = excluded.rule_name,
        daily_target_qty = excluded.daily_target_qty,
        base_min_pct = excluded.base_min_pct,
        base_bonus = excluded.base_bonus,
        tier_1_min_pct = excluded.tier_1_min_pct,
        tier_1_bonus = excluded.tier_1_bonus,
        tier_2_min_pct = excluded.tier_2_min_pct,
        tier_2_bonus = excluded.tier_2_bonus,
        tier_3_min_pct = excluded.tier_3_min_pct,
        tier_3_bonus = excluded.tier_3_bonus,
        updated_at = TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
    `).run({
      id,
      rule_name,
      daily_target_qty: Number(daily_target_qty) || 200,
      base_min_pct: Number(base_min_pct) || 90.0,
      base_bonus: Number(base_bonus) || 0.50,
      tier_1_min_pct: Number(tier_1_min_pct) || 100.0,
      tier_1_bonus: Number(tier_1_bonus) || 1.50,
      tier_2_min_pct: Number(tier_2_min_pct) || 110.0,
      tier_2_bonus: Number(tier_2_bonus) || 2.50,
      tier_3_min_pct: Number(tier_3_min_pct) || 120.0,
      tier_3_bonus: Number(tier_3_bonus) || 3.50,
    });

    logAudit({
      user_id: 'usr-admin',
      user_name: 'Administrator',
      action: 'UPDATE_DAILY_TARGET_RULES',
      module: 'Sewing Production',
      record_id: id,
      new_value: JSON.stringify(body),
    });

    const updated = db.prepare('SELECT * FROM sewing_daily_target_rules WHERE id = ?').get(id);

    return NextResponse.json({
      success: true,
      message: 'Daily target bonus rules updated successfully',
      rule: updated,
    });
  } catch (error: any) {
    console.error('Error in PUT /api/bonus/sewing/daily:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
