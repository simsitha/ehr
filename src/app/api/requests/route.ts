import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb, createNotification } from '@/lib/db';
import { ApprovalRequest } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    let employeeId = searchParams.get('employee_id');
    const scope = searchParams.get('scope'); // 'my' | 'team' | 'hr' | 'top_management' | 'all'

    let userRole: string | undefined;
    let authId: string | undefined;
    try {
      const cookieStore = await cookies();
      userRole = cookieStore.get('hestra_role')?.value;
      authId = cookieStore.get('hestra_auth')?.value;
    } catch {
      if (request && 'cookies' in request && (request as any).cookies?.get) {
        userRole = (request as any).cookies.get('hestra_role')?.value;
        authId = (request as any).cookies.get('hestra_auth')?.value;
      }
    }

    // Resolve employeeId for logged in user if needed
    let loggedInEmployeeId = authId;
    if (authId) {
      try {
        const u = db.prepare('SELECT employee_id FROM users WHERE id = ? OR username = ?').get(authId, authId) as any;
        if (u && u.employee_id) loggedInEmployeeId = u.employee_id;
      } catch {}
    }

    // If requester is an Employee, enforce filtering strictly to their own requests
    if (userRole === 'Employee' && loggedInEmployeeId) {
      employeeId = loggedInEmployeeId;
    }

    let sql = `
      SELECT 
        r.*,
        COALESCE(e.first_name || ' ' || e.last_name, u.name, 'Staff Member') as employee_name,
        COALESCE(e.role, u.role, 'Employee') as employee_role,
        COALESCE(e.avatar, u.avatar, '') as employee_avatar,
        COALESCE(d.name, 'General Department') as department_name,
        e.department_id,
        COALESCE(lm.first_name || ' ' || lm.last_name, 'Direct Manager') as resolved_manager_name
      FROM approval_requests r
      LEFT JOIN employees e ON e.id = r.employee_id
      LEFT JOIN users u ON (u.id = r.employee_id OR u.employee_id = r.employee_id)
      LEFT JOIN departments d ON d.id = e.department_id
      LEFT JOIN employees lm ON lm.id = r.line_manager_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      sql += ` AND r.status = ?`;
      params.push(status);
    }

    if (type && type !== 'all') {
      sql += ` AND r.request_type = ?`;
      params.push(type);
    }

    if (employeeId) {
      sql += ` AND (r.employee_id = ? OR r.employee_id = ?)`;
      params.push(employeeId, authId || employeeId);
    }

    // Role-based scope filtering
    const explicitManagerId = searchParams.get('line_manager_id');
    if (scope === 'team' || explicitManagerId) {
      const targetMgr = explicitManagerId || loggedInEmployeeId;
      if (targetMgr) {
        let targetEmpId = targetMgr;
        try {
          const u = db.prepare('SELECT employee_id FROM users WHERE id = ?').get(targetMgr) as any;
          if (u && u.employee_id) targetEmpId = u.employee_id;
        } catch {}

        sql += ` AND (r.line_manager_id = ? OR r.line_manager_id = ? OR e.manager_id = ? OR e.manager_id = ?)`;
        params.push(targetMgr, targetEmpId, targetMgr, targetEmpId);
      }
    } else if (scope === 'hr') {
      // HR approval queue
      sql += ` AND r.status = 'Pending HR'`;
    } else if (scope === 'top_management') {
      // Top management approval queue
      sql += ` AND r.status = 'Pending Top Management'`;
    }

    sql += ` ORDER BY r.created_at DESC`;

    const records = db.prepare(sql).all(...params) as ApprovalRequest[];
    return NextResponse.json(records);
  } catch (error: any) {
    console.error('Error fetching approval requests:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const {
      employee_id,
      request_type = 'Material / Equipment',
      item_name,
      item_category = 'standard_material',
      current_salary = 0,
      proposed_salary = 0,
      estimated_cost = 0,
      quantity = 1,
      urgency = 'Medium',
      reason,
      specifications = '',
    } = body;

    if (!employee_id || !item_name || !reason) {
      return NextResponse.json(
        { error: 'employee_id, item_name, and reason are required' },
        { status: 400 }
      );
    }

    // Resolve employee id if usr- was passed
    let finalEmpId = employee_id;
    let emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(employee_id) as any;
    if (!emp) {
      const u = db.prepare('SELECT employee_id FROM users WHERE id = ? OR username = ?').get(employee_id, employee_id) as any;
      if (u && u.employee_id) {
        finalEmpId = u.employee_id;
        emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(finalEmpId) as any;
      }
    }

    // Determine if this request requires Top Management approval:
    // As explicitly specified: "Some Material last approval is HR, Some case need approval from top management, such as: Laptop, computer, increase salary"
    const lowerItem = (item_name || '').toLowerCase();
    const lowerType = (request_type || '').toLowerCase();
    
    const isTopManagementCase =
      lowerItem.includes('laptop') ||
      lowerItem.includes('computer') ||
      lowerItem.includes('macbook') ||
      lowerItem.includes('workstation') ||
      lowerItem.includes('desktop') ||
      lowerItem.includes('salary') ||
      lowerItem.includes('increase salary') ||
      lowerType.includes('salary') ||
      item_category === 'salary_increase' ||
      item_category === 'high_value_asset' ||
      Number(estimated_cost) >= 500;

    const requiresTopManagement = isTopManagementCase ? 1 : 0;
    const finalCategory = lowerType.includes('salary') || lowerItem.includes('salary')
      ? 'salary_increase'
      : isTopManagementCase
      ? 'high_value_asset'
      : 'standard_material';

    // Generate clean request number e.g. REQ-2026-001
    const countRow = db.prepare('SELECT count(*) as count FROM approval_requests').get() as { count: number };
    const currentYear = new Date().getFullYear();
    const reqSeq = String((countRow?.count || 0) + 1).padStart(3, '0');
    const requestNumber = `REQ-${currentYear}-${reqSeq}`;
    const id = `req-${Date.now()}`;
    const now = new Date().toISOString();

    // Identify Line Manager
    const lineManagerId = emp?.manager_id || null;
    let lineManagerName = 'Line Manager';
    if (lineManagerId) {
      const m = db.prepare('SELECT first_name, last_name FROM employees WHERE id = ?').get(lineManagerId) as any;
      if (m) lineManagerName = `${m.first_name} ${m.last_name}`;
    }

    const baseSalary = Number(current_salary) || (emp ? Number(emp.salary) : 0);

    const insertStmt = db.prepare(`
      INSERT INTO approval_requests (
        id, request_number, employee_id, request_type, item_name,
        item_category, requires_top_management, current_salary, proposed_salary,
        estimated_cost, quantity, urgency, reason, specifications,
        status, line_manager_id, line_manager_name, line_manager_status,
        hr_status, top_management_status,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?,
        ?, ?
      )
    `);

    insertStmt.run(
      id,
      requestNumber,
      finalEmpId,
      request_type,
      item_name,
      finalCategory,
      requiresTopManagement,
      baseSalary,
      Number(proposed_salary) || 0,
      Number(estimated_cost) || 0,
      Number(quantity) || 1,
      urgency,
      reason,
      specifications,
      'Pending Line Manager',
      lineManagerId,
      lineManagerName,
      'Pending',
      'Pending',
      requiresTopManagement ? 'Pending' : 'N/A',
      now,
      now
    );

    try {
      createNotification({
        title: `New ${request_type}: ${item_name} (${requestNumber})`,
        title_km: `សំណើ${request_type}ថ្មី៖ ${item_name} (${requestNumber})`,
        message: `Submitted by ${emp ? emp.first_name + ' ' + emp.last_name : 'Staff Member'} - Urgency: ${urgency}`,
        message_km: `បញ្ជូនដោយ ${emp ? emp.first_name + ' ' + emp.last_name : 'បុគ្គលិក'} - កម្រិតបន្ទាន់៖ ${urgency}`,
        type: 'request',
        link: '/requests',
        role: 'Admin',
      });
    } catch (err) {
      console.error('Error creating request notification:', err);
    }

    const createdRecord = db.prepare('SELECT * FROM approval_requests WHERE id = ?').get(id);
    return NextResponse.json(createdRecord, { status: 201 });
  } catch (error: any) {
    console.error('Error creating approval request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
