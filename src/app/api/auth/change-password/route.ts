import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { userId, email, currentPassword, newPassword, confirmPassword } = body;

    // 1. Validation of required inputs
    if (!currentPassword || typeof currentPassword !== 'string') {
      return NextResponse.json(
        { error: 'សូមបញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្ន (Current password is required)' },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json(
        { error: 'សូមបញ្ចូលពាក្យសម្ងាត់ថ្មី (New password is required)' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោចណាស់ ៦ តួអក្សរ (New password must be at least 6 characters)' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'ពាក្យសម្ងាត់ថ្មី និងការបញ្ជាក់ពាក្យសម្ងាត់មិនត្រូវគ្នាទេ (New password and confirmation do not match)' },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'ពាក្យសម្ងាត់ថ្មីមិនអាចដូចពាក្យសម្ងាត់បច្ចុប្បន្នបានទេ (New password cannot be identical to current password)' },
        { status: 400 }
      );
    }

    // 2. Identify the target user
    const cleanUserId = (userId || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();

    let user: any = null;

    if (cleanUserId) {
      user = db.prepare(`
        SELECT * FROM users 
        WHERE id = ? 
           OR employee_id = ?
           OR LOWER(username) = LOWER(?)
      `).get(cleanUserId, cleanUserId, cleanUserId);
    }

    if (!user && cleanEmail) {
      user = db.prepare(`
        SELECT * FROM users 
        WHERE LOWER(email) = ?
      `).get(cleanEmail);
    }

    // 3. If user record is not directly in `users` table yet, check `employees` table or provision
    if (!user) {
      let emp: any = null;
      if (cleanUserId) {
        emp = db.prepare(`SELECT * FROM employees WHERE id = ? OR LOWER(email) = ?`).get(cleanUserId, cleanUserId);
      }
      if (!emp && cleanEmail) {
        emp = db.prepare(`SELECT * FROM employees WHERE LOWER(email) = ?`).get(cleanEmail);
      }

      // Check current password against standard defaults for unprovisioned account
      const isDefaultValid = currentPassword === '@9218njo0(TWp<3q"(3{' || currentPassword === 'hestra123' || currentPassword === 'admin123';
      if (!isDefaultValid) {
        return NextResponse.json(
          { error: 'ពាក្យសម្ងាត់បច្ចុប្បន្នមិនត្រឹមត្រូវទេ (Current password is incorrect)' },
          { status: 400 }
        );
      }

      // Provision new user record with the updated password
      const newId = `usr-${Date.now().toString().slice(-6)}`;
      const nowStr = new Date().toISOString().split('T')[0];
      const username = emp ? (emp.first_name || '').trim().toLowerCase() : (cleanEmail ? cleanEmail.split('@')[0] : 'user');
      const name = emp ? `${emp.first_name} ${emp.last_name}` : (cleanUserId.startsWith('emp-') ? 'Admin User' : 'User');
      const role = emp
        ? ((emp.role && (emp.role.toLowerCase().includes('manager') || emp.role.toLowerCase().includes('head'))) ? 'Manager' : 'Employee')
        : (cleanUserId.includes('admin') || cleanEmail.includes('admin') ? 'Admin' : 'Employee');
      const empId = emp ? emp.id : (cleanUserId || null);
      const deptName = emp ? (emp.department_name || 'ទូទៅ (General)') : 'ទូទៅ (General)';
      const userEmail = emp ? emp.email : (cleanEmail || `${username}@outlook.com`);

      db.prepare(`
        INSERT INTO users (id, username, name, email, role, status, employee_id, department_name, avatar, two_factor_enabled, permissions, password, last_login, created_at)
        VALUES (?, ?, ?, ?, ?, 'Active', ?, ?, ?, 0, 'self_service,clock_in,request_leave,view_payslips', ?, 'Just now', ?)
      `).run(
        newId,
        username,
        name,
        userEmail,
        role,
        empId,
        deptName,
        '',
        newPassword,
        nowStr
      );

      return NextResponse.json({
        success: true,
        message: 'ពាក្យសម្ងាត់របស់អ្នកត្រូវបានផ្លាស់ប្តូរដោយជោគជ័យ (Your password has been changed successfully)',
      });
    }

    // 4. Verify current password for existing user
    const DEFAULT_PASSWORD = '@9218njo0(TWp<3q"(3{';
    const storedPassword = user.password || DEFAULT_PASSWORD;
    const isCurrentPasswordCorrect =
      currentPassword === storedPassword ||
      ((storedPassword === DEFAULT_PASSWORD || storedPassword === 'hestra123') &&
        (currentPassword === DEFAULT_PASSWORD || currentPassword === 'hestra123' || (user.role === 'Admin' && currentPassword === 'admin123')));

    if (!isCurrentPasswordCorrect) {
      return NextResponse.json(
        { error: 'ពាក្យសម្ងាត់បច្ចុប្បន្នមិនត្រឹមត្រូវទេ (Current password is incorrect)' },
        { status: 400 }
      );
    }

    // 5. Update user's password in database
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(newPassword, user.id);

    return NextResponse.json({
      success: true,
      message: 'ពាក្យសម្ងាត់របស់អ្នកត្រូវបានផ្លាស់ប្តូរដោយជោគជ័យ (Your password has been changed successfully)',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'មានបញ្ហាម៉ាស៊ីនមេក្នុងការប្តូរពាក្យសម្ងាត់ (Internal server error updating password)' },
      { status: 500 }
    );
  }
}
