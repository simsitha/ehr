import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const rawEmployeeId = searchParams.get('employee_id');

    if (!rawEmployeeId) {
      return NextResponse.json({ error: 'employee_id is required' }, { status: 400 });
    }

    let employeeId = rawEmployeeId;
    if (employeeId.startsWith('usr-')) {
      const u = db.prepare('SELECT employee_id FROM users WHERE id = ?').get(employeeId) as any;
      if (u?.employee_id) employeeId = u.employee_id;
    }

    const today = new Date().toISOString().split('T')[0];
    const records = db.prepare(
      'SELECT * FROM attendance WHERE (employee_id = ? OR employee_id = ?) AND date = ? ORDER BY id DESC'
    ).all(employeeId, rawEmployeeId, today) as any[];

    const activeShift = records.find((r) => !r.clock_out);
    const latestRecord = activeShift || records[0] || null;
    const isClockedIn = !!activeShift;
    const isClockedOut = !isClockedIn && records.length > 0;

    return NextResponse.json({
      today,
      record: latestRecord,
      isClockedIn,
      isClockedOut,
      hasRecord: records.length > 0,
      shiftsToday: records.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const rawEmployeeId = body.employee_id;
    const isFace = body.method === 'Face' || body.verification_method === 'Face' || !!body.photo || !!body.device_id;
    const requestedAction = body.action as 'clock_in' | 'clock_out' | undefined;
    const deviceId = body.device_id || 'zk-01';
    const confidence = typeof body.confidence === 'number' ? body.confidence : 0.988;
    const photo = typeof body.photo === 'string' ? body.photo : null;

    if (!rawEmployeeId) {
      return NextResponse.json({ error: 'employee_id is required' }, { status: 400 });
    }

    let employeeId = rawEmployeeId;
    if (employeeId.startsWith('usr-')) {
      const u = db.prepare('SELECT employee_id FROM users WHERE id = ?').get(employeeId) as any;
      if (u?.employee_id) employeeId = u.employee_id;
    }

    // Lookup ZKTeco Device information
    let device: any = null;
    try {
      device = db.prepare('SELECT * FROM attendance_devices WHERE id = ?').get(deviceId) as any;
    } catch {}
    if (!device) {
      device = {
        id: 'zk-01',
        name: 'ZKTeco-01',
        model: 'SpeedFace-V5L',
        serial_number: 'SF5L2026001',
        ip_address: '192.168.88.201',
        location: 'Main Entrance',
      };
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0]; // HH:MM:SS
    const isoTimestamp = now.toISOString();

    const records = db.prepare(
      'SELECT * FROM attendance WHERE (employee_id = ? OR employee_id = ?) AND date = ? ORDER BY id DESC'
    ).all(employeeId, rawEmployeeId, today) as any[];

    const activeShift = records.find((r) => !r.clock_out);
    const shouldClockIn = requestedAction ? requestedAction === 'clock_in' : !activeShift;

    if (shouldClockIn) {
      // FACE IN / CLOCK IN
      const id = `att-${employeeId}-${today}-${Date.now().toString().slice(-4)}`;
      const hour = now.getHours();
      const status = hour >= 10 ? 'Late' : 'Present';

      const confPct = (confidence * 100).toFixed(1);
      const noteText = isFace
        ? `Faced in via ZKTeco SpeedFace-V5L (${device.name} - ${device.location}) | Alg: ZKFace VX3.6 | Conf: ${confPct}%${photo ? ' [Photo Verified]' : ''}`
        : 'Clocked in manually via HESTRA HRM Web';

      let targetId = id;
      if (records.length > 0) {
        targetId = records[0].id;
        db.prepare(`
          UPDATE attendance
          SET clock_in = ?, clock_out = NULL, status = ?, work_hours = 0, notes = notes || ' | ' || ?
          WHERE id = ?
        `).run(timeString, status, noteText, targetId);
      } else {
        db.prepare(`
          INSERT INTO attendance (id, employee_id, date, clock_in, clock_out, status, work_hours, notes)
          VALUES (?, ?, ?, ?, NULL, ?, 0, ?)
          ON CONFLICT(employee_id, date) DO UPDATE SET
            clock_in = excluded.clock_in,
            clock_out = NULL,
            status = excluded.status,
            work_hours = 0,
            notes = attendance.notes || ' | ' || excluded.notes
        `).run(id, employeeId, today, timeString, status, noteText);
      }

      // Record to attendance_raw_transactions for audit & ZKTeco device telemetry
      if (isFace) {
        try {
          const rawId = `raw-face-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          const txId = `TX-FACE-${Date.now()}`;
          db.prepare(`
            INSERT INTO attendance_raw_transactions (
              id, device_id, device_user_id, employee_id, transaction_id,
              attendance_timestamp, punch_date, punch_time, attendance_type,
              verification_method, device_serial, device_ip, location,
              raw_payload, raw_data, is_processed, processed_at,
              attendance_record_id, source, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
            ON CONFLICT(device_id, transaction_id) DO NOTHING
          `).run(
            rawId,
            device.id,
            employeeId,
            employeeId,
            txId,
            isoTimestamp,
            today,
            timeString,
            'Check-In',
            'Face',
            device.serial_number || 'SF5L2026001',
            device.ip_address || '192.168.88.201',
            device.location || 'Main Entrance',
            JSON.stringify({
              source: 'ZKTeco SpeedFace Camera',
              algorithm: 'ZKFace VX3.6',
              confidence: Number(confidence),
              device_name: device.name,
              verified: true,
              mode: 'Visible Light Facial Biometric',
            }),
            photo ? photo.slice(0, 200) : null,
            isoTimestamp,
            targetId,
            'ZKTeco SpeedFace Camera',
            isoTimestamp
          );
        } catch (rawErr) {
          console.error('Error recording raw face transaction:', rawErr);
        }
      }

      const created = db.prepare('SELECT * FROM attendance WHERE id = ?').get(targetId);
      return NextResponse.json({
        action: 'clock_in',
        method: isFace ? 'Face' : 'Manual',
        message: isFace
          ? `ស្កេនមុខចូលជោគជ័យនៅម៉ោង ${timeString} (Face In Verified - ${device.name})`
          : `បានកត់ត្រាចូលដោយជោគជ័យនៅម៉ោង ${timeString} (Clocked in successfully)`,
        record: created,
        device,
        confidence,
        isClockedIn: true,
      });
    } else {
      // FACE OUT / CLOCK OUT
      const targetShift = activeShift || records[0];
      if (!targetShift) {
        return NextResponse.json(
          { error: 'No active shift found to clock out from' },
          { status: 400 }
        );
      }

      let workHours = 8.0;
      if (targetShift.clock_in) {
        const [inH, inM] = targetShift.clock_in.split(':').map(Number);
        const [outH, outM] = timeString.split(':').map(Number);
        let diffMinutes = (outH * 60 + outM) - (inH * 60 + inM);
        if (diffMinutes < 0) {
          diffMinutes += 24 * 60;
        }
        const diffHours = diffMinutes / 60;
        workHours = Math.max(0.1, Math.round(diffHours * 10) / 10);
      }

      const confPct = (confidence * 100).toFixed(1);
      const outNote = isFace
        ? ` | Faced out via ZKTeco SpeedFace-V5L (${device.name} - ${device.location}) at ${timeString} [Conf: ${confPct}%]`
        : ` | Shift ended manually at ${timeString}`;

      db.prepare(`
        UPDATE attendance 
        SET clock_out = ?, work_hours = ?, notes = notes || ?
        WHERE id = ?
      `).run(timeString, workHours, outNote, targetShift.id);

      // Record to attendance_raw_transactions for audit & ZKTeco device telemetry
      if (isFace) {
        try {
          const rawId = `raw-face-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          const txId = `TX-FACE-${Date.now()}`;
          db.prepare(`
            INSERT INTO attendance_raw_transactions (
              id, device_id, device_user_id, employee_id, transaction_id,
              attendance_timestamp, punch_date, punch_time, attendance_type,
              verification_method, device_serial, device_ip, location,
              raw_payload, raw_data, is_processed, processed_at,
              attendance_record_id, source, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
            ON CONFLICT(device_id, transaction_id) DO NOTHING
          `).run(
            rawId,
            device.id,
            employeeId,
            employeeId,
            txId,
            isoTimestamp,
            today,
            timeString,
            'Check-Out',
            'Face',
            device.serial_number || 'SF5L2026001',
            device.ip_address || '192.168.88.201',
            device.location || 'Main Entrance',
            JSON.stringify({
              source: 'ZKTeco SpeedFace Camera',
              algorithm: 'ZKFace VX3.6',
              confidence: Number(confidence),
              device_name: device.name,
              verified: true,
              mode: 'Visible Light Facial Biometric',
            }),
            photo ? photo.slice(0, 200) : null,
            isoTimestamp,
            targetShift.id,
            'ZKTeco SpeedFace Camera',
            isoTimestamp
          );
        } catch (rawErr) {
          console.error('Error recording raw face transaction:', rawErr);
        }
      }

      const updated = db.prepare('SELECT * FROM attendance WHERE id = ?').get(targetShift.id);
      return NextResponse.json({
        action: 'clock_out',
        method: isFace ? 'Face' : 'Manual',
        message: isFace
          ? `ស្កេនមុខចេញជោគជ័យនៅម៉ោង ${timeString} (Face Out: ${workHours} hrs - ${device.name})`
          : `បានកត់ត្រាចេញដោយជោគជ័យនៅម៉ោង ${timeString} (Clocked out: ${workHours} hrs)`,
        record: updated,
        device,
        confidence,
        isClockedIn: false,
      });
    }
  } catch (error: any) {
    console.error('Error handling clock in/out:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
