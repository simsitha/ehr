import { NextResponse } from 'next/server';
import { getPayrollPeriods, getPayrollPeriod, savePayrollPeriod, logAudit } from '@/lib/db';
import { PayrollPeriod } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const period = getPayrollPeriod(id);
      if (!period) return NextResponse.json({ error: 'Payroll period not found' }, { status: 404 });
      return NextResponse.json(period);
    }

    const periods = getPayrollPeriods();
    return NextResponse.json(periods);
  } catch (error: any) {
    console.error('Error fetching payroll periods:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, start_date, end_date, working_days, working_hours_per_day, status, action, user_name } = body;

    const period = id ? getPayrollPeriod(id) : null;
    const now = new Date().toISOString();

    if (action === 'lock') {
      if (!period) {
        return NextResponse.json({ error: 'Period not found' }, { status: 404 });
      }
      savePayrollPeriod({
        ...period,
        status: 'Locked',
        locked_by: user_name || 'usr-admin',
        locked_at: now,
      });

      logAudit({
        user_name: user_name || 'Administrator',
        action: 'LOCK_PAYROLL_PERIOD',
        module: 'Payroll',
        record_id: period.id,
        old_value: period.status,
        new_value: 'Locked',
      });

      return NextResponse.json({ success: true, message: `Period ${period.name} locked successfully.` });
    }

    if (action === 'unlock') {
      if (!period) {
        return NextResponse.json({ error: 'Period not found' }, { status: 404 });
      }
      savePayrollPeriod({
        ...period,
        status: 'Processing',
        locked_by: undefined,
        locked_at: undefined,
      });

      logAudit({
        user_name: user_name || 'Administrator',
        action: 'UNLOCK_PAYROLL_PERIOD',
        module: 'Payroll',
        record_id: period.id,
        old_value: period.status,
        new_value: 'Processing',
      });

      return NextResponse.json({ success: true, message: `Period ${period.name} unlocked.` });
    }

    if (action === 'approve') {
      if (!period) {
        return NextResponse.json({ error: 'Period not found' }, { status: 404 });
      }
      savePayrollPeriod({
        ...period,
        status: 'Approved',
        approved_by: user_name || 'usr-admin',
        approved_at: now,
      });

      logAudit({
        user_name: user_name || 'Administrator',
        action: 'APPROVE_PAYROLL_PERIOD',
        module: 'Payroll',
        record_id: period.id,
        old_value: period.status,
        new_value: 'Approved',
      });

      return NextResponse.json({ success: true, message: `Period ${period.name} approved.` });
    }

    // Default upsert
    const newPeriod: Partial<PayrollPeriod> = {
      id: id || `period-${start_date?.substring(0, 7)}`,
      name: name || `${start_date?.substring(0, 7)}`,
      start_date,
      end_date,
      working_days: working_days ?? 26,
      working_hours_per_day: working_hours_per_day ?? 8,
      status: status || 'Draft',
    };

    savePayrollPeriod(newPeriod);

    logAudit({
      user_name: user_name || 'Administrator',
      action: 'SAVE_PAYROLL_PERIOD',
      module: 'Payroll',
      record_id: newPeriod.id,
      new_value: JSON.stringify(newPeriod),
    });

    return NextResponse.json({ success: true, period: getPayrollPeriod(newPeriod.id!) });
  } catch (error: any) {
    console.error('Error saving payroll period:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
