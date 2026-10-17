import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ZKTecoDeploymentService } from '@/lib/zkteco/deployment-service';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get('hestra_role')?.value;
    const adminUser = cookieStore.get('hestra_user')?.value || 'HR Administrator';

    if (userRole === 'Employee') {
      return NextResponse.json({ error: 'Unauthorized: Admin or Manager permission required' }, { status: 403 });
    }

    const { id } = await params;
    const result = await ZKTecoDeploymentService.deployEnrolledUsersToEmployees(id, adminUser);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
