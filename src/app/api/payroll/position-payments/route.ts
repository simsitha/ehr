import { NextResponse } from 'next/server';
import {
  getPositionPayments,
  createPositionPayment,
  CreatePositionPaymentInput,
} from '@/lib/positionPaymentDb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employee_id = searchParams.get('employee_id') || undefined;
    const payroll_period = searchParams.get('payroll_period') || undefined;
    const department_id = searchParams.get('department_id') || undefined;
    const payment_type = searchParams.get('payment_type') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const payments = getPositionPayments({
      employee_id,
      payroll_period,
      department_id,
      payment_type,
      status,
      search,
    });

    return NextResponse.json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error: any) {
    console.error('Error fetching position payments:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch position payments' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const input: CreatePositionPaymentInput = {
      employee_id: body.employee_id,
      payment_name: body.payment_name,
      payment_type: body.payment_type || 'Allowance',
      amount: Number(body.amount),
      currency: body.currency || 'USD',
      payroll_period: body.payroll_period,
      effective_date: body.effective_date,
      end_date: body.end_date || null,
      taxable: body.taxable !== undefined ? Boolean(body.taxable) : true,
      include_in_nssf: body.include_in_nssf !== undefined ? Boolean(body.include_in_nssf) : true,
      remarks: body.remarks || null,
      status: body.status || 'Active',
      created_by: body.user_name || body.created_by || 'Administrator',
    };

    const newPayment = createPositionPayment(input);

    return NextResponse.json({
      success: true,
      message: 'Position payment created successfully and synced with payroll ledger.',
      data: newPayment,
    });
  } catch (error: any) {
    const msg = (error.message || '').toLowerCase();
    const status = msg.includes('locked') || msg.includes('paid') || msg.includes('reopen') ? 403 : 400;
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create position payment' },
      { status }
    );
  }
}
