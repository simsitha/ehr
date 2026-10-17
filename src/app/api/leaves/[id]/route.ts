import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const body = await request.json();
    const {
      status, // 'Approved' | 'Rejected' | 'Pending Admin' | 'Pending Manager'
      stage,  // 'manager' | 'admin'
      reviewer_id = 'usr-admin',
      reviewer_comments = '',
      reviewer_role,
    } = body;

    const cookieStore = await cookies();
    const callerRole = reviewer_role || cookieStore.get('hestra_role')?.value || 'Admin';

    const leave = db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(id) as any;
    if (!leave) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    const reviewedAt = new Date().toISOString();

    // 1. Rejection logic (either Line Manager or Admin can reject)
    if (status === 'Rejected') {
      const isManagerStage = leave.status === 'Pending Manager' || leave.status === 'Pending' || callerRole === 'Manager';
      
      db.prepare(`
        UPDATE leave_requests SET
          status = 'Rejected',
          reviewer_id = ?,
          reviewed_at = ?,
          reviewer_comments = ?,
          line_manager_id = CASE WHEN ? THEN ? ELSE line_manager_id END,
          line_manager_reviewed_at = CASE WHEN ? THEN ? ELSE line_manager_reviewed_at END,
          line_manager_comments = CASE WHEN ? THEN ? ELSE line_manager_comments END,
          admin_reviewer_id = CASE WHEN NOT ? THEN ? ELSE admin_reviewer_id END,
          admin_reviewed_at = CASE WHEN NOT ? THEN ? ELSE admin_reviewed_at END,
          admin_comments = CASE WHEN NOT ? THEN ? ELSE admin_comments END
        WHERE id = ?
      `).run(
        reviewer_id,
        reviewedAt,
        reviewer_comments,
        isManagerStage ? 1 : 0,
        reviewer_id,
        isManagerStage ? 1 : 0,
        reviewedAt,
        isManagerStage ? 1 : 0,
        reviewer_comments,
        isManagerStage ? 1 : 0,
        reviewer_id,
        isManagerStage ? 1 : 0,
        reviewedAt,
        isManagerStage ? 1 : 0,
        reviewer_comments,
        id
      );
    } 
    // 2. Stage 1: Line Manager Approval -> Advances to 'Pending Admin'
    else if (
      stage === 'manager' ||
      status === 'Pending Admin' ||
      ((leave.status === 'Pending Manager' || leave.status === 'Pending') && callerRole === 'Manager') ||
      ((leave.status === 'Pending Manager' || leave.status === 'Pending') && status === 'Approved' && callerRole !== 'Admin')
    ) {
      const lmComment = reviewer_comments || 'Approved by Line Manager. Forwarded to HR Administrator for final approval.';

      db.prepare(`
        UPDATE leave_requests SET
          status = 'Pending Admin',
          line_manager_id = ?,
          line_manager_reviewed_at = ?,
          line_manager_comments = ?,
          reviewer_id = ?,
          reviewed_at = ?,
          reviewer_comments = ?
        WHERE id = ?
      `).run(
        reviewer_id,
        reviewedAt,
        lmComment,
        reviewer_id,
        reviewedAt,
        lmComment,
        id
      );
    }
    // 3. Stage 2: Administrator Approval -> Final 'Approved'
    else if (status === 'Approved' || stage === 'admin') {
      // If caller is Manager trying to approve Stage 2, block them
      if (leave.status === 'Pending Admin' && callerRole === 'Manager') {
        return NextResponse.json(
          { error: 'ជំហានទី២ តម្រូវឱ្យមានការអនុម័តពីរដ្ឋបាល HR Admin (Step 2 requires Administrator approval)' },
          { status: 403 }
        );
      }

      const adminComment = reviewer_comments || 'Final approval granted by HR Administrator.';

      db.prepare(`
        UPDATE leave_requests SET
          status = 'Approved',
          admin_reviewer_id = ?,
          admin_reviewed_at = ?,
          admin_comments = ?,
          reviewer_id = ?,
          reviewed_at = ?,
          reviewer_comments = ?
        WHERE id = ?
      `).run(
        reviewer_id,
        reviewedAt,
        adminComment,
        reviewer_id,
        reviewedAt,
        adminComment,
        id
      );

      // Only deduct balance once final Admin approval is granted
      if (leave.status !== 'Approved') {
        const field =
          leave.leave_type === 'Sick'
            ? 'sick_used'
            : leave.leave_type === 'Casual'
            ? 'casual_used'
            : 'annual_used';

        db.prepare(`
          UPDATE leave_balances 
          SET ${field} = ${field} + ?
          WHERE employee_id = ?
        `).run(leave.days_count, leave.employee_id);

        // Requirement 8: Approved leave must automatically update attendance records
        try {
          const code =
            leave.leave_type === 'Sick'
              ? 'SL'
              : leave.leave_type === 'Maternity'
              ? 'ML'
              : leave.leave_type === 'Annual'
              ? 'AL'
              : 'OL';

          const sDate = new Date(leave.start_date);
          const eDate = new Date(leave.end_date);
          const insertOrUpdateAtt = db.prepare(`
            INSERT INTO attendance (id, employee_id, date, status, work_hours, notes, code, hours, overtime_hours, source)
            VALUES (@id, @employee_id, @date, 'On Leave', 8.0, @notes, @code, 8.0, 0, 'leaves')
            ON CONFLICT(employee_id, date) DO UPDATE SET
              status = 'On Leave',
              code = @code,
              hours = 8.0,
              notes = @notes,
              source = 'leaves'
          `);

          for (let d = new Date(sDate); d <= eDate; d.setDate(d.getDate() + 1)) {
            // Skip Sundays (standard rest day)
            if (d.getDay() !== 0) {
              const dStr = d.toISOString().split('T')[0];
              insertOrUpdateAtt.run({
                id: `att-${leave.employee_id}-${dStr}`,
                employee_id: leave.employee_id,
                date: dStr,
                notes: `Approved ${leave.leave_type} Leave: ${leave.reason || ''}`,
                code,
              });
            }
          }
        } catch (attErr) {
          console.error('Error synchronizing leave to attendance:', attErr);
        }
      }
    } else {
      return NextResponse.json({ error: 'Invalid approval status or stage' }, { status: 400 });
    }

    // Return the updated leave record with all reviewer relations
    const updated = db.prepare(`
      SELECT 
        lr.*,
        COALESCE(e.first_name || ' ' || e.last_name, u.name, 'Staff Member') as employee_name,
        COALESCE(e.role, u.role, 'Employee') as employee_role,
        COALESCE(e.avatar, u.avatar, '') as employee_avatar,
        COALESCE(lm.first_name || ' ' || lm.last_name, lmu.name) as line_manager_name,
        COALESCE(adm.first_name || ' ' || adm.last_name, admu.name) as admin_reviewer_name,
        COALESCE(r.first_name || ' ' || r.last_name, ru.name) as reviewer_name
      FROM leave_requests lr
      LEFT JOIN employees e ON e.id = lr.employee_id
      LEFT JOIN users u ON (u.id = lr.employee_id OR u.employee_id = lr.employee_id)
      LEFT JOIN employees lm ON lm.id = lr.line_manager_id
      LEFT JOIN users lmu ON (lmu.id = lr.line_manager_id OR lmu.employee_id = lr.line_manager_id)
      LEFT JOIN employees adm ON adm.id = lr.admin_reviewer_id
      LEFT JOIN users admu ON (admu.id = lr.admin_reviewer_id OR admu.employee_id = lr.admin_reviewer_id)
      LEFT JOIN employees r ON r.id = lr.reviewer_id
      LEFT JOIN users ru ON (ru.id = lr.reviewer_id OR ru.employee_id = lr.reviewer_id)
      WHERE lr.id = ?
    `).get(id);

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error reviewing leave request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
