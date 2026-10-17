import { NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';
import { DEFAULT_DAILY_TARGET_RULE, DailyTargetRule } from '@/lib/payrollRules';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    let rule = db.prepare('SELECT * FROM sewing_daily_target_rules WHERE is_active = 1 LIMIT 1').get() as DailyTargetRule | undefined;
    if (!rule) {
      rule = DEFAULT_DAILY_TARGET_RULE;
    }
    return NextResponse.json({ success: true, rule });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
      message: 'Daily target bonus rules saved successfully',
      rule: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
