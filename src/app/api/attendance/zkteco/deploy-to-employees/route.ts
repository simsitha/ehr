import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ZKTecoDeploymentService } from '@/lib/zkteco/deployment-service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get('hestra_role')?.value;
    const adminUser = cookieStore.get('hestra_user')?.value || 'HR Administrator';

    if (userRole === 'Employee') {
      return NextResponse.json({ error: 'Unauthorized: Admin or Manager permission required' }, { status: 403 });
    }

    let deviceId = 'zk-01';
    try {
      const body = await request.json();
      if (body?.device_id) {
        deviceId = body.device_id;
      }
    } catch {
      // Body may be empty, defaults to zk-01
    }

    const result = await ZKTecoDeploymentService.deployEnrolledUsersToEmployees(deviceId, adminUser);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
