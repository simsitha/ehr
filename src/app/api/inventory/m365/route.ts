import { NextResponse } from 'next/server';
import {
  getM365Accounts,
  getM365AccountById,
  createM365Account,
  updateM365Account,
  deleteM365Account,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const plan = searchParams.get('plan') || undefined;
    const status = searchParams.get('status') || undefined;
    const department = searchParams.get('department') || undefined;
    const id = searchParams.get('id');

    if (id) {
      const account = getM365AccountById(id);
      if (!account) {
        return NextResponse.json({ error: 'M365 Account not found' }, { status: 404 });
      }
      return NextResponse.json(account);
    }

    const data = getM365Accounts({ search, plan, status, department });
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching M365 accounts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch M365 accounts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.email || !body.license_plan) {
      return NextResponse.json(
        { error: 'Email (User Principal Name) and License Plan are required.' },
        { status: 400 }
      );
    }

    // Basic email validation
    const email = body.email.trim().toLowerCase();
    if (!email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address.' },
        { status: 400 }
      );
    }

    const newAccount = createM365Account({
      email,
      display_name: body.display_name?.trim() || email.split('@')[0],
      license_plan: body.license_plan,
      status: body.status || (body.assigned_to ? 'Active' : 'Available'),
      assigned_to: body.assigned_to || null,
      assigned_date: body.assigned_date || (body.assigned_to ? new Date().toISOString() : null),
      mfa_status: body.mfa_status || 'Enforced',
      mailbox_usage_gb: Number(body.mailbox_usage_gb) || 0,
      mailbox_quota_gb: Number(body.mailbox_quota_gb) || 50,
      onedrive_usage_gb: Number(body.onedrive_usage_gb) || 0,
      onedrive_quota_gb: Number(body.onedrive_quota_gb) || 1024,
      monthly_cost: body.monthly_cost !== undefined ? Number(body.monthly_cost) : undefined,
      renewal_date: body.renewal_date || null,
      admin_notes: body.admin_notes || null,
    }, body.performed_by || 'IT Administrator');

    return NextResponse.json(newAccount, { status: 201 });
  } catch (error: any) {
    console.error('Error creating M365 account:', error);
    const msg = error.message || 'Failed to create M365 account';
    const status = msg.includes('UNIQUE') ? 409 : 500;
    return NextResponse.json(
      { error: msg.includes('UNIQUE') ? 'A Microsoft 365 account with this email already exists.' : msg },
      { status }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Account ID is required.' }, { status: 400 });
    }

    const updated = updateM365Account(body.id, body, body.performed_by || 'IT Administrator');
    if (!updated) {
      return NextResponse.json({ error: 'M365 Account not found.' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating M365 account:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update M365 account' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Account ID is required.' }, { status: 400 });
    }

    const success = deleteM365Account(id);
    if (!success) {
      return NextResponse.json({ error: 'M365 Account not found or already deleted.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'M365 Account deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting M365 account:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete M365 account' },
      { status: 500 }
    );
  }
}
