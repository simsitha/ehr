import { NextResponse } from 'next/server';
import {
  getPositionPaymentById,
  updatePositionPayment,
  togglePositionPaymentStatus,
  deletePositionPayment,
  UpdatePositionPaymentInput,
} from '@/lib/positionPaymentDb';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payment = getPositionPaymentById(id);
    if (!payment) {
      return NextResponse.json(
        { success: false, error: `Position payment "${id}" not found.` },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: payment });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch position payment' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const input: UpdatePositionPaymentInput = {
      payment_name: body.payment_name,
      payment_type: body.payment_type,
      amount: body.amount !== undefined ? Number(body.amount) : undefined,
      currency: body.currency,
      payroll_period: body.payroll_period,
      effective_date: body.effective_date,
      end_date: body.end_date !== undefined ? (body.end_date || null) : undefined,
      taxable: body.taxable !== undefined ? Boolean(body.taxable) : undefined,
      include_in_nssf: body.include_in_nssf !== undefined ? Boolean(body.include_in_nssf) : undefined,
      remarks: body.remarks !== undefined ? (body.remarks ? body.remarks.trim() : null) : undefined,
      status: body.status,
      updated_by: body.user_name || body.updated_by || 'Administrator',
    };

    const updated = updatePositionPayment(id, input);
    return NextResponse.json({
      success: true,
      message: 'Position payment updated successfully and synced with payroll ledger.',
      data: updated,
    });
  } catch (error: any) {
    const msg = (error.message || '').toLowerCase();
    const status = msg.includes('locked') || msg.includes('paid') || msg.includes('reopen') ? 403 : 400;
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update position payment' },
      { status }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const targetStatus = body.status;
    const userName = body.user_name || 'Administrator';

    const updated = togglePositionPaymentStatus(id, targetStatus, userName);
    return NextResponse.json({
      success: true,
      message: `Position payment status set to ${updated.status} and synced with payroll ledger.`,
      data: updated,
    });
  } catch (error: any) {
    console.error('Error toggling position payment status:', error);
    const msg = (error.message || '').toLowerCase();
    const status = msg.includes('locked') || msg.includes('paid') || msg.includes('reopen') ? 403 : 400;
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to toggle position payment status' },
      { status }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userName = searchParams.get('user_name') || 'Administrator';

    deletePositionPayment(id, userName);
    return NextResponse.json({
      success: true,
      message: 'Position payment deleted successfully and removed from payroll ledger.',
    });
  } catch (error: any) {
    console.error('Error deleting position payment:', error);
    const msg = (error.message || '').toLowerCase();
    const status = msg.includes('locked') || msg.includes('paid') || msg.includes('reopen') ? 403 : 400;
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete position payment' },
      { status }
    );
  }
}
