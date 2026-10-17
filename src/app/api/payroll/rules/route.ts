import { NextResponse } from 'next/server';
import { getPayrollRules, savePayrollRules, logAudit } from '@/lib/db';
import { PayrollRulesConfig } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rules = getPayrollRules();
    return NextResponse.json(rules);
  } catch (error: any) {
    console.error('Error getting payroll rules:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<PayrollRulesConfig>;
    const currentRules = getPayrollRules();

    const mergedRules: PayrollRulesConfig = {
      ...currentRules,
      ...body,
    };

    savePayrollRules(mergedRules);

    logAudit({
      user_id: 'usr-admin',
      user_name: 'Administrator',
      action: 'UPDATE_PAYROLL_RULES',
      module: 'Payroll Rules',
      old_value: JSON.stringify(currentRules),
      new_value: JSON.stringify(mergedRules),
    });

    return NextResponse.json({
      success: true,
      message: 'Payroll rules updated successfully',
      rules: mergedRules,
    });
  } catch (error: any) {
    console.error('Error updating payroll rules:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
