import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getZKTecoDevices, createZKTecoDevice } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const devices = getZKTecoDevices();
    return NextResponse.json(devices);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get('hestra_role')?.value;
    if (userRole === 'Employee') {
      return NextResponse.json({ error: 'Unauthorized: Admin or Manager permission required' }, { status: 403 });
    }

    const body = await request.json();

    if (!body.name || !body.ip_address || !body.location) {
      return NextResponse.json(
        { error: 'Missing required fields: name, ip_address, and location are required.' },
        { status: 400 }
      );
    }

    const device = createZKTecoDevice({
      name: body.name,
      model: body.model || 'SpeedFace-V5L',
      platform: body.platform || 'ZAM230',
      ip_address: body.ip_address,
      port: Number(body.port) || 8081,
      connection_type: body.connection_type || 'Push/ADMS',
      auth_password: body.auth_password || '0',
      location: body.location,
      department_id: body.department_id || null,
      is_enabled: body.is_enabled !== undefined ? (body.is_enabled ? 1 : 0) : 1,
      sync_interval_minutes: Number(body.sync_interval_minutes) || 5,
      connection_timeout: Number(body.connection_timeout) || 10,
      retry_attempts: Number(body.retry_attempts) || 3,
      auto_sync: body.auto_sync !== undefined ? (body.auto_sync ? 1 : 0) : 1,
    });

    return NextResponse.json(device, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
