import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb, logAudit } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth-session';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const sql = `
      SELECT 
        r.*,
        COALESCE(e.first_name || ' ' || e.last_name, u.name, 'Staff Member') as employee_name,
        COALESCE(e.role, u.role, 'Employee') as employee_role,
        COALESCE(e.avatar, u.avatar, '') as employee_avatar,
        COALESCE(d.name, 'General Department') as department_name,
        e.department_id,
        e.salary as employee_current_salary,
        e.email as employee_email
      FROM approval_requests r
      LEFT JOIN employees e ON e.id = r.employee_id
      LEFT JOIN users u ON (u.id = r.employee_id OR u.employee_id = r.employee_id)
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE r.id = ? OR r.request_number = ?
    `;

    const record = db.prepare(sql).get(id, id);
    if (!record) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch (error: any) {
    console.error('Error fetching request:', error);
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

    const {
      action, // 'approve' | 'reject'
      stage = 'auto', // 'line_manager' | 'hr' | 'top_management' | 'auto'
      reviewer_id,
      reviewer_name,
      comments = '',
    } = body;

    const cookieStore = await cookies();
    const userRole = cookieStore.get('hestra_role')?.value || 'Admin';
    const authUsername = cookieStore.get('hestra_username')?.value || 'admin';

    const reqRecord = db.prepare('SELECT * FROM approval_requests WHERE id = ?').get(id) as any;
    if (!reqRecord) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const resolvedReviewerName = reviewer_name || (userRole === 'Admin' ? 'HR Administration' : 'Management Reviewer');
    const resolvedReviewerId = reviewer_id || authUsername;

    // Resolve stage automatically based on current status if 'auto'
    let effectiveStage = stage;
    if (effectiveStage === 'auto') {
      if (reqRecord.status === 'Pending Line Manager') effectiveStage = 'line_manager';
      else if (reqRecord.status === 'Pending HR') effectiveStage = 'hr';
      else if (reqRecord.status === 'Pending Top Management') effectiveStage = 'top_management';
    }

    // 1. REJECTION
    if (action === 'reject') {
      const stageLabel =
        effectiveStage === 'line_manager'
          ? 'Line Manager'
          : effectiveStage === 'hr'
          ? 'HR Department'
          : 'Top Management';

      let updateSql = `
        UPDATE approval_requests SET
          status = 'Rejected',
          rejected_by_stage = ?,
          rejection_reason = ?,
          updated_at = ?
      `;
      const updateParams: any[] = [stageLabel, comments || `Rejected by ${stageLabel}`, now];

      if (effectiveStage === 'line_manager') {
        updateSql += `, line_manager_status = 'Rejected', line_manager_reviewed_at = ?, line_manager_comments = ?, line_manager_id = ?, line_manager_name = ?`;
        updateParams.push(now, comments, resolvedReviewerId, resolvedReviewerName);
      } else if (effectiveStage === 'hr') {
        updateSql += `, hr_status = 'Rejected', hr_reviewed_at = ?, hr_comments = ?, hr_reviewer_id = ?, hr_reviewer_name = ?`;
        updateParams.push(now, comments, resolvedReviewerId, resolvedReviewerName);
      } else if (effectiveStage === 'top_management') {
        updateSql += `, top_management_status = 'Rejected', top_management_reviewed_at = ?, top_management_comments = ?, top_management_id = ?, top_management_name = ?`;
        updateParams.push(now, comments, resolvedReviewerId, resolvedReviewerName);
      }

      updateSql += ` WHERE id = ?`;
      updateParams.push(id);

      db.prepare(updateSql).run(...updateParams);

      const updated = db.prepare('SELECT * FROM approval_requests WHERE id = ?').get(id);
      return NextResponse.json({ message: 'Request rejected', request: updated });
    }

    // 2. APPROVAL
    if (action === 'approve') {
      // Stage 1: Line Manager Approval -> Always advances to 'Pending HR'
      if (effectiveStage === 'line_manager') {
        db.prepare(`
          UPDATE approval_requests SET
            status = 'Pending HR',
            line_manager_status = 'Approved',
            line_manager_id = ?,
            line_manager_name = ?,
            line_manager_reviewed_at = ?,
            line_manager_comments = ?,
            updated_at = ?
          WHERE id = ?
        `).run(
          resolvedReviewerId,
          resolvedReviewerName,
          now,
          comments || 'Approved by Line Manager. Forwarded to HR Department.',
          now,
          id
        );
      }

      // Stage 2: HR Approval
      // Rule: "Some Material last approval is HR, Some case need approval from top management, such as: Laptop, computer, increase salary"
      else if (effectiveStage === 'hr') {
        const requiresTop = reqRecord.requires_top_management === 1;

        if (requiresTop) {
          // Advance to Stage 3: Top Management
          db.prepare(`
            UPDATE approval_requests SET
              status = 'Pending Top Management',
              hr_status = 'Approved',
              hr_reviewer_id = ?,
              hr_reviewer_name = ?,
              hr_reviewed_at = ?,
              hr_comments = ?,
              top_management_status = 'Pending',
              updated_at = ?
            WHERE id = ?
          `).run(
            resolvedReviewerId,
            resolvedReviewerName,
            now,
            comments || 'Approved by HR Department. Forwarded to Top Management for final executive authorization.',
            now,
            id
          );
        } else {
          // Material last approval is HR -> Final Approved!
          db.prepare(`
            UPDATE approval_requests SET
              status = 'Approved',
              hr_status = 'Approved',
              hr_reviewer_id = ?,
              hr_reviewer_name = ?,
              hr_reviewed_at = ?,
              hr_comments = ?,
              top_management_status = 'N/A',
              updated_at = ?
            WHERE id = ?
          `).run(
            resolvedReviewerId,
            resolvedReviewerName,
            now,
            comments || 'Final approval granted by HR Department. Requisition authorized.',
            now,
            id
          );
        }
      }

      // Stage 3: Top Management Approval (Laptop, computer, increase salary) -> Final Approved!
      else if (effectiveStage === 'top_management') {
        db.prepare(`
          UPDATE approval_requests SET
            status = 'Approved',
            top_management_status = 'Approved',
            top_management_id = ?,
            top_management_name = ?,
            top_management_reviewed_at = ?,
            top_management_comments = ?,
            updated_at = ?
          WHERE id = ?
        `).run(
          resolvedReviewerId,
          resolvedReviewerName,
          now,
          comments || 'Final executive authorization granted by Top Management.',
          now,
          id
        );

        // If this was an "Increase Salary" request, execute automatic salary adjustment
        const isSalaryIncrease =
          reqRecord.request_type === 'Salary Increase' ||
          reqRecord.item_category === 'salary_increase' ||
          (reqRecord.item_name || '').toLowerCase().includes('salary');

        if (isSalaryIncrease && Number(reqRecord.proposed_salary) > 0) {
          const empId = reqRecord.employee_id;
          const prevSalary = Number(reqRecord.current_salary) || 0;
          const newSalary = Number(reqRecord.proposed_salary);
          const increaseAmt = Math.max(0, newSalary - prevSalary);
          const increasePct = prevSalary > 0 ? Math.round((increaseAmt / prevSalary) * 1000) / 10 : 0;
          const todayDate = now.split('T')[0];

          // 1. Update employee base salary
          db.prepare(`
            UPDATE employees SET
              salary = ?,
              last_salary_review = ?
            WHERE id = ?
          `).run(newSalary, todayDate, empId);

          // 2. Insert audit record in salary_adjustments
          const adjId = `adj-${Date.now()}`;
          db.prepare(`
            INSERT INTO salary_adjustments (
              id, employee_id, previous_salary, new_salary, increase_amount,
              increase_percentage, effective_date, adjustment_type, currency,
              reason, approved_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            adjId,
            empId,
            prevSalary,
            newSalary,
            increaseAmt,
            increasePct,
            todayDate,
            'Staff Portal Request (Top Management Approved)',
            'USD ($)',
            reqRecord.reason || 'Salary increase request approved by Top Management',
            resolvedReviewerName || 'Top Management (CEO)',
            now
          );
        }
      }

      const updated = db.prepare('SELECT * FROM approval_requests WHERE id = ?').get(id);
      return NextResponse.json({ message: 'Request approved successfully', request: updated });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating approval request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    
    const reqRecord = db.prepare('SELECT * FROM approval_requests WHERE id = ?').get(id) as any;
    if (!reqRecord) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('hestra_session')?.value;
    const session = await verifySessionToken(sessionCookie);
    const userRole = session?.role || cookieStore.get('hestra_role')?.value || 'Admin';
    const userId = session?.userId || cookieStore.get('hestra_auth')?.value || '';

    const isManagerOrAdmin = userRole === 'Admin' || userRole === 'Manager';
    const isOwner = reqRecord.employee_id === userId || (reqRecord as any).user_id === userId;

    if (!isManagerOrAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to delete this request' },
        { status: 403 }
      );
    }

    db.prepare('DELETE FROM approval_requests WHERE id = ?').run(id);

    try {
      logAudit({
        action: 'DELETE',
        module: 'Requests',
        record_id: reqRecord.request_number || id,
        user_id: userId,
        old_value: `${reqRecord.item_name} (${reqRecord.request_type || 'Requisition'}) - Status: ${reqRecord.status}`,
      });
    } catch (auditErr) {
      console.warn('Audit log error on delete request:', auditErr);
    }

    return NextResponse.json({ success: true, message: 'Request deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
