import { NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';
import { OvertimeRequest } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const record = db.prepare(`
      SELECT 
        o.*,
        COALESCE(e.first_name || ' ' || e.last_name, 'Staff Member') as employee_name,
        COALESCE(e.khmer_name, '') as khmer_name,
        COALESCE(e.gender, '') as gender,
        COALESCE(e.group_name, 'General') as group_name,
        COALESCE(e.role, 'Employee') as employee_role,
        COALESCE(e.avatar, '') as employee_avatar,
        COALESCE(e.department_id, '') as department_id,
        COALESCE(d.name, 'General') as department_name
      FROM overtime_requests o
      JOIN employees e ON e.id = o.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE o.id = ?
    `).get(id) as OvertimeRequest;

    if (!record) {
      return NextResponse.json({ error: 'Overtime request not found' }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch (error: any) {
    console.error('Error fetching overtime request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const body = await request.json();
    const { action, reviewer_id = 'usr-admin', reviewer_name = 'Administrator', comments, status } = body;

    const existing = db.prepare('SELECT * FROM overtime_requests WHERE id = ?').get(id) as any;
    if (!existing) {
      return NextResponse.json({ error: 'Overtime request not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    let newStatus = existing.status;

    if (action === 'manager_approve' || action === 'supervisor_approve') {
      newStatus = 'Pending Admin';
      db.prepare(`
        UPDATE overtime_requests 
        SET status = 'Pending Admin',
            line_manager_id = ?,
            line_manager_reviewed_at = ?,
            line_manager_comments = ?
        WHERE id = ?
      `).run(reviewer_id, now, comments || 'Supervisor / Manager Approved', id);
    } else if (action === 'manager_reject' || action === 'supervisor_reject') {
      newStatus = 'Rejected';
      db.prepare(`
        UPDATE overtime_requests 
        SET status = 'Rejected',
            line_manager_id = ?,
            line_manager_reviewed_at = ?,
            line_manager_comments = ?
        WHERE id = ?
      `).run(reviewer_id, now, comments || 'Supervisor / Manager Rejected', id);
    } else if (action === 'admin_approve' || action === 'hr_approve' || action === 'direct_approve') {
      newStatus = 'Approved';
      db.prepare(`
        UPDATE overtime_requests 
        SET status = 'Approved',
            admin_reviewer_id = ?,
            admin_reviewed_at = ?,
            admin_comments = ?
        WHERE id = ?
      `).run(reviewer_id, now, comments || 'HR / Admin Final Approved', id);

      // Seamlessly sync approved overtime hours to attendance table
      try {
        const attId = `att-${existing.employee_id}-${existing.date}`;
        db.prepare(`
          INSERT INTO attendance (id, employee_id, date, status, work_hours, overtime_hours, source)
          VALUES (?, ?, ?, 'Present', 8.0, ?, 'overtime_approved')
          ON CONFLICT(employee_id, date) DO UPDATE SET
            overtime_hours = COALESCE(attendance.overtime_hours, 0) + excluded.overtime_hours
        `).run(attId, existing.employee_id, existing.date, existing.hours);
      } catch (attErr) {
        console.error('Error syncing overtime to attendance:', attErr);
      }
    } else if (action === 'admin_reject' || action === 'hr_reject' || action === 'reject') {
      newStatus = 'Rejected';
      db.prepare(`
        UPDATE overtime_requests 
        SET status = 'Rejected',
            admin_reviewer_id = ?,
            admin_reviewed_at = ?,
            admin_comments = ?
        WHERE id = ?
      `).run(reviewer_id, now, comments || 'HR / Admin Rejected', id);
    } else if (action === 'cancel') {
      newStatus = 'Cancelled';
      db.prepare('UPDATE overtime_requests SET status = ? WHERE id = ?').run('Cancelled', id);
    } else if (action === 'draft_to_submitted') {
      newStatus = 'Submitted';
      db.prepare('UPDATE overtime_requests SET status = ? WHERE id = ?').run('Submitted', id);
    } else if (status) {
      newStatus = status;
      db.prepare('UPDATE overtime_requests SET status = ? WHERE id = ?').run(status, id);
      if (status === 'Approved') {
        const attId = `att-${existing.employee_id}-${existing.date}`;
        db.prepare(`
          INSERT INTO attendance (id, employee_id, date, status, work_hours, overtime_hours, source)
          VALUES (?, ?, ?, 'Present', 8.0, ?, 'overtime_approved')
          ON CONFLICT(employee_id, date) DO UPDATE SET
            overtime_hours = COALESCE(attendance.overtime_hours, 0) + excluded.overtime_hours
        `).run(attId, existing.employee_id, existing.date, existing.hours);
      }
    }

    logAudit({
      user_name: reviewer_name,
      action: `OVERTIME_${action?.toUpperCase() || 'UPDATE'}`,
      module: 'Overtime',
      record_id: id,
      old_value: existing.status,
      new_value: newStatus,
    });

    const updated = db.prepare(`
      SELECT 
        o.*,
        COALESCE(e.first_name || ' ' || e.last_name, 'Staff Member') as employee_name,
        COALESCE(e.khmer_name, '') as khmer_name,
        COALESCE(e.gender, '') as gender,
        COALESCE(e.group_name, 'General') as group_name,
        COALESCE(e.role, 'Employee') as employee_role,
        COALESCE(e.avatar, '') as employee_avatar,
        COALESCE(e.department_id, '') as department_id,
        COALESCE(d.name, 'General') as department_name
      FROM overtime_requests o
      JOIN employees e ON e.id = o.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE o.id = ?
    `).get(id) as OvertimeRequest;

    return NextResponse.json({ success: true, request: updated });
  } catch (error: any) {
    console.error('Error updating overtime request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const existing = db.prepare('SELECT * FROM overtime_requests WHERE id = ?').get(id) as any;
    db.prepare('DELETE FROM overtime_requests WHERE id = ?').run(id);

    logAudit({
      user_name: 'Administrator',
      action: 'DELETE_OVERTIME_REQUEST',
      module: 'Overtime',
      record_id: id,
      old_value: existing ? JSON.stringify(existing) : null,
      new_value: null,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting overtime request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
