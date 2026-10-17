import { NextResponse } from 'next/server';
import { getZKTecoDevices } from '@/lib/db';
import { NetworkDiagnostics } from '@/lib/zkteco/network-diagnostics';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const devices = getZKTecoDevices();
    const targets = devices.map((d) => ({
      ip: d.ip_address,
      port: d.port,
      name: d.name,
      connection_type: d.connection_type,
      last_connection: d.last_connection,
      status: d.status,
    }));

    const diagnostics = await NetworkDiagnostics.runFullDiagnostics(targets);
    return NextResponse.json(diagnostics);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
