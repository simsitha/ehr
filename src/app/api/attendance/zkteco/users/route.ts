import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getZKTecoDeviceUsers,
  upsertZKTecoDeviceUser,
  updateZKTecoDeviceUser,
  deleteZKTecoDeviceUser,
  mapZKTecoUser,
  unmapZKTecoUser,
  getZKTecoDeviceById,
  queueDeviceCommand,
} from '@/lib/db';
import { ZKTecoSyncService } from '@/lib/zkteco/sync-service';
import { ZKTecoDeploymentService } from '@/lib/zkteco/deployment-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('device_id') || undefined;
    const search = searchParams.get('search') || undefined;
    const syncStatus = searchParams.get('status') || undefined;
    const biometric = searchParams.get('biometric') || undefined;

    const users = getZKTecoDeviceUsers({ deviceId, search, syncStatus, biometric });
    return NextResponse.json(users);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get('hestra_role')?.value;
    const adminUser = cookieStore.get('hestra_user')?.value || 'HR Administrator';
    if (userRole === 'Employee') {
      return NextResponse.json({ error: 'Unauthorized: Admin or Manager permission required' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    // 1. Map Device User to Employee
    if (action === 'map') {
      const { record_id, employee_id } = body;
      if (!record_id || !employee_id) {
        return NextResponse.json({ error: 'record_id and employee_id are required' }, { status: 400 });
      }
      const success = mapZKTecoUser(record_id, employee_id, 'Manual', 1.0);
      return NextResponse.json({ success, message: 'User successfully mapped to employee.' });
    }

    // 2. Unmap Device User
    if (action === 'unmap') {
      const { record_id } = body;
      if (!record_id) {
        return NextResponse.json({ error: 'record_id is required' }, { status: 400 });
      }
      const success = unmapZKTecoUser(record_id);
      return NextResponse.json({ success, message: 'User unmapped.' });
    }

    // 3. Enroll New User on Device
    if (action === 'enroll' || action === 'create') {
      const {
        device_id,
        device_user_id,
        device_user_name,
        card_number,
        privilege,
        has_face,
        has_fingerprint,
        has_card,
        has_password,
        employee_id,
        user_photo,
      } = body;

      if (!device_id || !device_user_id) {
        return NextResponse.json({ error: 'device_id and device_user_id (PIN) are required' }, { status: 400 });
      }

      const device = getZKTecoDeviceById(device_id);
      if (!device) {
        return NextResponse.json({ error: `Device ${device_id} not found` }, { status: 404 });
      }

      const cleanPin = String(device_user_id).trim();
      const userName = (device_user_name || '').trim();

      upsertZKTecoDeviceUser({
        device_id,
        device_user_id: cleanPin,
        device_user_name: userName || undefined,
        card_number: card_number || undefined,
        privilege: privilege || 'User',
        has_face: has_face ? 1 : 0,
        has_fingerprint: has_fingerprint ? 1 : 0,
        has_card: has_card || card_number ? 1 : 0,
        has_password: has_password ? 1 : 0,
        biometric_status: (has_face || has_fingerprint) ? 'Enrolled' : 'Not Enrolled',
        sync_status: employee_id ? 'Mapped' : 'Needs Mapping',
        employee_id: employee_id || undefined,
        match_confidence: employee_id ? 1.0 : 0,
        match_method: employee_id ? 'Manual Enrollment' : 'None',
        user_photo: user_photo || undefined,
      });

      // Queue command to provision onto physical terminal
      const targetKey = device.serial_number || device.ip_address || device.id;
      const priCode = privilege === 'Admin' ? '14' : '0';
      const cmdParts = [`PIN=${cleanPin}`];
      if (userName) cmdParts.push(`Name=${userName}`);
      cmdParts.push(`Pri=${priCode}`);
      if (card_number) cmdParts.push(`Card=${card_number}`);
      queueDeviceCommand(targetKey, `DATA UPDATE USERINFO ${cmdParts.join('\t')}`, device.id);

      return NextResponse.json({
        success: true,
        message: `User PIN #${cleanPin} successfully enrolled on ${device.name}. Provisioning command queued.`,
      });
    }

    // 4. Update Enrolled User
    if (action === 'update') {
      const { record_id, updates } = body;
      if (!record_id || !updates) {
        return NextResponse.json({ error: 'record_id and updates are required' }, { status: 400 });
      }

      const success = updateZKTecoDeviceUser(record_id, updates);
      return NextResponse.json({ success, message: 'Enrolled user updated successfully.' });
    }

    // 5. Delete Enrolled User from Terminal
    if (action === 'delete') {
      const { record_id } = body;
      if (!record_id) {
        return NextResponse.json({ error: 'record_id is required' }, { status: 400 });
      }

      const success = deleteZKTecoDeviceUser(record_id);
      return NextResponse.json({
        success,
        message: success ? 'User removed from device and command queued.' : 'User not found.',
      });
    }

    // 6. Push all active employees to device
    if (action === 'push_all') {
      const { device_id } = body;
      if (!device_id) {
        return NextResponse.json({ error: 'device_id is required' }, { status: 400 });
      }

      const result = await ZKTecoSyncService.pushEmployeesToDevice(device_id, adminUser);
      return NextResponse.json(result);
    }

    // 7. Synchronize Enrolled User Photos
    if (action === 'sync_photos') {
      const { device_id } = body;
      const result = await ZKTecoSyncService.syncUserPhotos(device_id, adminUser);
      return NextResponse.json(result);
    }

    // 8. Deploy Enrolled Device Users to HRM Employees
    if (action === 'deploy_to_employees') {
      const deviceId = body.device_id || 'zk-01';
      const result = await ZKTecoDeploymentService.deployEnrolledUsersToEmployees(deviceId, adminUser);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported: enroll, update, delete, map, unmap, push_all, sync_photos, deploy_to_employees' },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

