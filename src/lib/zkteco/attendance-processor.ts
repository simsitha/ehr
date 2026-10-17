/**
 * src/lib/zkteco/attendance-processor.ts
 * Integrates ZKTeco Raw Transactions into the Hestra HRM Attendance Engine.
 * Handles:
 * - Multi-device pairing (ZKTeco-01 Main Entrance & ZKTeco-02 Secondary Entrance)
 * - Shift lookup (from duty_roster or default shift)
 * - Configurable grace periods (e.g. 10 minutes) for Late calculation
 * - Break times and overtime calculation
 * - Updates the official attendance table with audit trail and source tagging
 */

import { getDb } from '@/lib/db';
import { getShiftConfig } from '@/lib/roster-shifts';

export interface ProcessAttendanceOptions {
  date?: string; // YYYY-MM-DD (optional, if omitted processes all unprocessed)
  employeeId?: string;
  gracePeriodMinutes?: number; // default 10
}

export interface ProcessResult {
  processedRawCount: number;
  attendanceRecordsCreatedOrUpdated: number;
  errors: number;
}

export class AttendanceProcessor {
  /**
   * Process all unprocessed raw transactions
   */
  public static processRawTransactions(options?: ProcessAttendanceOptions): ProcessResult {
    const db = getDb();
    const gracePeriod = options?.gracePeriodMinutes !== undefined ? options.gracePeriodMinutes : 10;

    let sql = `
      SELECT 
        t.id, t.device_id, t.device_user_id, t.employee_id, t.transaction_id,
        t.attendance_timestamp, t.punch_date, t.punch_time, t.attendance_type,
        t.verification_method, t.device_serial, t.device_ip, t.location,
        d.name as device_name
      FROM attendance_raw_transactions t
      JOIN attendance_devices d ON d.id = t.device_id
      WHERE t.is_processed = 0 AND t.employee_id IS NOT NULL AND t.employee_id != ''
    `;
    const params: any[] = [];

    if (options?.date) {
      sql += ` AND t.punch_date = ?`;
      params.push(options.date);
    }

    if (options?.employeeId) {
      sql += ` AND t.employee_id = ?`;
      params.push(options.employeeId);
    }

    sql += ` ORDER BY t.punch_date ASC, t.punch_time ASC`;

    const rawLogs = db.prepare(sql).all(...params) as any[];

    if (rawLogs.length === 0) {
      return {
        processedRawCount: 0,
        attendanceRecordsCreatedOrUpdated: 0,
        errors: 0,
      };
    }

    // Group logs by (employee_id, punch_date)
    const grouped = new Map<string, any[]>();
    for (const log of rawLogs) {
      const key = `${log.employee_id}__${log.punch_date}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(log);
    }

    let recordsCount = 0;
    let errorsCount = 0;
    const now = new Date().toISOString();

    for (const [key, logs] of grouped.entries()) {
      const [employeeId, date] = key.split('__');

      try {
        // Also fetch any previously processed raw logs for that same employee & date to have full picture
        const allLogsForDay = db.prepare(`
          SELECT 
            t.id, t.device_id, t.attendance_timestamp, t.punch_time,
            t.attendance_type, t.verification_method, t.location, d.name as device_name
          FROM attendance_raw_transactions t
          JOIN attendance_devices d ON d.id = t.device_id
          WHERE t.employee_id = ? AND t.punch_date = ?
          ORDER BY t.punch_time ASC
        `).all(employeeId, date) as any[];

        // Extract times
        const times = allLogsForDay.map((l) => l.punch_time).sort();
        const earliestTime = times[0];
        const latestTime = times.length > 1 ? times[times.length - 1] : null;

        // Check if there is already an attendance record (e.g. manual clock-in)
        const existingAtt = db.prepare(`
          SELECT * FROM attendance WHERE employee_id = ? AND date = ?
        `).get(employeeId, date) as any;

        // Determine final clock_in and clock_out
        let finalClockIn = earliestTime;
        let finalClockOut = latestTime;

        if (existingAtt) {
          if (existingAtt.clock_in && (!finalClockIn || existingAtt.clock_in < finalClockIn)) {
            finalClockIn = existingAtt.clock_in;
          }
          if (existingAtt.clock_out && (!finalClockOut || existingAtt.clock_out > finalClockOut)) {
            finalClockOut = existingAtt.clock_out;
          }
        }

        // Lookup shift from duty_roster or default shift
        const rosterShift = db.prepare(`
          SELECT * FROM duty_roster WHERE employee_id = ? AND date = ?
        `).get(employeeId, date) as any;

        const shiftDef = getShiftConfig(rosterShift ? rosterShift.shift_type : 'office');
        const shiftStart = rosterShift?.start_time || shiftDef.start_time || '07:30';
        const shiftEnd = rosterShift?.end_time || shiftDef.end_time || '16:30';

        // Calculate status: Present, Late, or Absent
        let status = 'Present';
        if (finalClockIn) {
          const [inH, inM] = finalClockIn.split(':').map(Number);
          const [startH, startM] = shiftStart.split(':').map(Number);

          const inMinutes = inH * 60 + inM;
          const startMinutes = startH * 60 + startM;

          // Late if clock-in is past shift start + grace period
          if (inMinutes > startMinutes + gracePeriod) {
            status = 'Late';
          } else {
            status = 'Present';
          }
        } else {
          status = 'Absent';
        }

        // Calculate hours worked
        let workHours = 8.0;
        let overtimeHours = 0.0;

        if (finalClockIn && finalClockOut) {
          const [inH, inM] = finalClockIn.split(':').map(Number);
          const [outH, outM] = finalClockOut.split(':').map(Number);

          let diffMin = (outH * 60 + outM) - (inH * 60 + inM);
          if (diffMin < 0) {
            diffMin += 24 * 60; // overnight shift
          }

          // Subtract 1 hour unpaid meal break if span covers standard lunch (>= 5 hours)
          if (diffMin >= 5 * 60) {
            diffMin -= 60;
          }

          workHours = Math.max(0.5, Math.round((diffMin / 60) * 10) / 10);

          // Calculate overtime hours if check-out is past scheduled shift end
          const [endH, endM] = shiftEnd.split(':').map(Number);
          const endMinutes = endH * 60 + endM;
          const outMinutes = outH * 60 + outM;

          if (outMinutes > endMinutes + 15) {
            const otDiffMin = outMinutes - endMinutes;
            overtimeHours = Math.round((otDiffMin / 60) * 10) / 10;
          }
        } else if (finalClockIn && !finalClockOut) {
          // Half day or active punch
          workHours = 4.0;
        }

        // Aggregate devices & locations used
        const devicesUsed = Array.from(new Set(allLogsForDay.map((l) => `${l.device_name} (${l.location || 'Entrance'})`))).join(' & ');
        const verificationsUsed = Array.from(new Set(allLogsForDay.map((l) => l.verification_method))).join(', ');

        const attendanceId = existingAtt ? existingAtt.id : `att-${employeeId}-${date}`;
        const notes = `ZKTeco Biometric: ${devicesUsed} [${verificationsUsed}] | Shift: ${shiftStart}-${shiftEnd}`;

        // Upsert into attendance table
        db.prepare(`
          INSERT INTO attendance (
            id, employee_id, date, clock_in, clock_out,
            status, work_hours, overtime_hours, source, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ZKTeco Direct', ?)
          ON CONFLICT(employee_id, date) DO UPDATE SET
            clock_in = COALESCE(excluded.clock_in, attendance.clock_in),
            clock_out = COALESCE(excluded.clock_out, attendance.clock_out),
            status = excluded.status,
            work_hours = excluded.work_hours,
            overtime_hours = excluded.overtime_hours,
            source = 'ZKTeco Direct',
            notes = excluded.notes
        `).run(
          attendanceId,
          employeeId,
          date,
          finalClockIn,
          finalClockOut,
          status,
          workHours,
          overtimeHours,
          notes
        );

        // Mark raw transactions as processed
        const rawIds = logs.map((l) => l.id);
        for (const rawId of rawIds) {
          db.prepare(`
            UPDATE attendance_raw_transactions SET
              is_processed = 1,
              processed_at = ?,
              attendance_record_id = ?
            WHERE id = ?
          `).run(now, attendanceId, rawId);
        }

        recordsCount++;
      } catch (err) {
        console.error(`Error processing attendance for ${key}:`, err);
        errorsCount++;
      }
    }

    return {
      processedRawCount: rawLogs.length,
      attendanceRecordsCreatedOrUpdated: recordsCount,
      errors: errorsCount,
    };
  }
}
