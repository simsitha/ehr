import { NextResponse } from 'next/server';
import { getDb, getPayrollRules } from '@/lib/db';
import { Employee, isBoardMember } from '@/lib/types';
import { cleanEnglishOnly } from '@/lib/translations';
import { calculateSeniorityAllowanceFromDate } from '@/lib/payrollRules';
import { computeEmployeePayroll } from '@/lib/payrollEngine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const department = searchParams.get('department') || '';
    const status = searchParams.get('status') || '';
    const employmentType = searchParams.get('type') || '';
    const role = searchParams.get('role') || searchParams.get('position') || '';

    let sql = `
      SELECT 
        e.*,
        d.name as department_name,
        m.first_name || ' ' || m.last_name as manager_name
      FROM employees e
      LEFT JOIN departments d ON d.id = e.department_id
      LEFT JOIN employees m ON m.id = e.manager_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (q) {
      sql += ` AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.khmer_name LIKE ? OR e.id LIKE ? OR e.email LIKE ? OR e.role LIKE ?)`;
      const pattern = `%${q}%`;
      params.push(pattern, pattern, pattern, pattern, pattern, pattern);
    }

    if (department && department !== 'all') {
      sql += ` AND e.department_id = ?`;
      params.push(department);
    }

    if (status && status !== 'all') {
      sql += ` AND e.status = ?`;
      params.push(status);
    }

    if (employmentType && employmentType !== 'all') {
      sql += ` AND e.employment_type = ?`;
      params.push(employmentType);
    }

    if (role && role !== 'all') {
      sql += ` AND e.role = ?`;
      params.push(role);
    }

    sql += ` ORDER BY e.first_name ASC`;

    const employees = db.prepare(sql).all(...params) as Employee[];

    return NextResponse.json(employees);
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();

    const {
      id: customId,
      first_name,
      last_name,
      email,
      phone = '',
      role,
      department_id,
      employment_type = 'ពេញម៉ោង (Full-Time)',
      employee_type = 'បុគ្គលិកពេញសិទ្ធិ (Regular / Permanent)',
      status = 'Active',
      salary = 1200,
      join_date = new Date().toISOString().split('T')[0],
      manager_id = null,
      avatar,
      location = 'Phnom Penh',
      bio = '',
      gender = 'ប្រុស (Male)',
      dob = '',
      nationality = 'Cambodian',
      marital_status = 'នៅលីវ (Single)',
      national_id = '',
      current_address = '',
      province_city = 'រាជធានីភ្នំពេញ (Phnom Penh)',
      district = '',
      commune_sangkat = '',
      village = '',
      contract_type = 'UDC (មិនកំណត់ថិរវេលា)',
      contract_start = '',
      contract_end = '',
      work_location = 'Head Office',
      salary_currency = 'USD ($)',
      salary_frequency = 'កន្លះខែ (Semi-monthly)',
      bank_name = 'ABA Bank',
      bank_account_name = '',
      bank_account_number = '',
      nssf_member = 'មាន (Yes)',
      nssf_number = '',
      nssf_reg_date = '',
      emergency_contact_name = '',
      emergency_contact_relationship = '',
      emergency_contact_phone = '',
      emergency_contact_address = '',
      doc_national_id = '',
      doc_passport = '',
      doc_contract = '',
      doc_others = '',
      transport_allowance = 0,
      meal_allowance = 0,
      housing_allowance = 0,
      attendance_allowance = 0,
      skill_allowance = 0,
      seniority_bonus = 0,
      pay_grade = 'Level 3 - Officer',
      khmer_name = '',
      position_allowance = 0,
      sewing_skill_matrix = 0,
      labor_type = 'Direct Labour',
      working_period = 0,
      group_name = null,
      group_id = null,
      employee_id: altEmpId,
    } = body;

    if (!first_name || !last_name || !role || !department_id) {
      return NextResponse.json(
        { error: 'first_name, last_name, role, and department_id are required' },
        { status: 400 }
      );
    }

    const finalEmail = email && typeof email === 'string' && email.trim() ? email.trim() : null;

    // Only use uploaded photo, no default avatar
    const finalAvatar = avatar && typeof avatar === 'string' && avatar.trim() ? avatar.trim() : '';

    let finalDeptId = department_id;
    if (department_id) {
      const deptRow = db.prepare('SELECT id, name FROM departments WHERE id = ? OR name = ?').get(department_id, department_id) as any;
      if (deptRow) {
        finalDeptId = deptRow.id;
      }
    }

    let finalGroupId = group_id || null;
    let finalGroupName = group_name || null;
    if (finalGroupId && !finalGroupName) {
      const gRow = db.prepare('SELECT name FROM employee_groups WHERE id = ?').get(finalGroupId) as any;
      if (gRow) finalGroupName = gRow.name;
    } else if (finalGroupName && !finalGroupId) {
      const gRow = db.prepare('SELECT id FROM employee_groups WHERE name = ?').get(finalGroupName) as any;
      if (gRow) finalGroupId = gRow.id;
    }

    const requestedId = (customId || altEmpId || '').trim();
    const id = requestedId ? requestedId : `EMP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const createdAt = new Date().toISOString();

    const existingId = db.prepare('SELECT id, first_name, last_name FROM employees WHERE id = ?').get(id) as any;
    if (existingId) {
      return NextResponse.json(
        { error: `Employee ID "${id}" is already assigned to ${existingId.first_name} ${existingId.last_name}. Please choose another ID.` },
        { status: 409 }
      );
    }

    if (finalEmail) {
      const existingEmail = db.prepare('SELECT id, first_name, last_name FROM employees WHERE LOWER(email) = LOWER(?)').get(finalEmail) as any;
      if (existingEmail) {
        return NextResponse.json(
          { error: `Email "${finalEmail}" is already used by ${existingEmail.first_name} ${existingEmail.last_name} (${existingEmail.id})` },
          { status: 400 }
        );
      }
    }

    const insertStmt = db.prepare(`
      INSERT INTO employees (
        id, first_name, last_name, khmer_name, email, phone, role, department_id,
        employment_type, employee_type, status, salary, join_date, manager_id, avatar,
        location, bio, emergency_contact_name, emergency_contact_phone,
        gender, dob, nationality, marital_status, national_id,
        current_address, province_city, district, commune_sangkat, village,
        contract_type, contract_start, contract_end, work_location,
        salary_currency, salary_frequency, bank_name, bank_account_name, bank_account_number,
        nssf_member, nssf_number, nssf_reg_date,
        emergency_contact_relationship, emergency_contact_address,
        doc_national_id, doc_passport, doc_contract, doc_others,
        transport_allowance, meal_allowance, housing_allowance, attendance_allowance,
        skill_allowance, seniority_bonus, position_allowance, sewing_skill_matrix, labor_type, working_period, pay_grade,
        group_name, group_id,
        created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?,
        ?
      )
    `);

    insertStmt.run(
      id,
      first_name,
      last_name,
      khmer_name || null,
      finalEmail,
      phone,
      role,
      finalDeptId,
      employment_type,
      employee_type,
      status,
      Number(salary) || 0,
      join_date,
      manager_id || null,
      finalAvatar,
      cleanEnglishOnly(location) || 'Phnom Penh',
      bio,
      emergency_contact_name,
      emergency_contact_phone,
      gender,
      dob,
      cleanEnglishOnly(nationality) || 'Cambodian',
      marital_status,
      national_id,
      current_address,
      province_city,
      district,
      commune_sangkat,
      village,
      contract_type,
      contract_start,
      contract_end,
      cleanEnglishOnly(work_location) || 'Head Office',
      salary_currency,
      salary_frequency,
      bank_name,
      bank_account_name,
      bank_account_number,
      nssf_member,
      nssf_number,
      nssf_reg_date,
      emergency_contact_relationship,
      emergency_contact_address,
      doc_national_id,
      doc_passport,
      doc_contract,
      doc_others,
      body.housing_transport_allowance !== undefined
        ? 0
        : (Number(String(transport_allowance || 0).replace(/[^0-9.-]/g, '')) || 0),
      Number(String(meal_allowance || 0).replace(/[^0-9.-]/g, '')) || 0,
      body.housing_transport_allowance !== undefined
        ? (Number(String(body.housing_transport_allowance || 0).replace(/[^0-9.-]/g, '')) || 0)
        : (Number(String(housing_allowance || 0).replace(/[^0-9.-]/g, '')) || 0),
      Number(String(attendance_allowance || 0).replace(/[^0-9.-]/g, '')) || 0,
      Number(String(skill_allowance || 0).replace(/[^0-9.-]/g, '')) || 0,
      Number(String(seniority_bonus || 0).replace(/[^0-9.-]/g, '')) > 0
        ? (Number(String(seniority_bonus).replace(/[^0-9.-]/g, '')) || 0)
        : calculateSeniorityAllowanceFromDate(join_date).allowance,
      Number(String(position_allowance || 0).replace(/[^0-9.-]/g, '')) || 0,
      Number(String(sewing_skill_matrix || 0).replace(/[^0-9.-]/g, '')) || 0,
      labor_type || 'Direct Labour',
      Number(working_period) || 0,
      pay_grade || 'Level 3 - Officer',
      finalGroupName,
      finalGroupId,
      createdAt
    );

    // Also initialize leave balance
    db.prepare(`
      INSERT INTO leave_balances (id, employee_id, annual_total, annual_used, sick_total, sick_used, casual_total, casual_used)
      VALUES (?, ?, 20, 0, 10, 0, 5, 0)
    `).run(`bal-${id}`, id);

    // Fetch the newly created employee with relations
    const newEmployee = db.prepare(`
      SELECT 
        e.*,
        d.name as department_name,
        m.first_name || ' ' || m.last_name as manager_name
      FROM employees e
      LEFT JOIN departments d ON d.id = e.department_id
      LEFT JOIN employees m ON m.id = e.manager_id
      WHERE e.id = ?
    `).get(id) as any;

    // Automatically provision / sync user account with First Name as username
    const calculatedUsername = (first_name || '').trim().toLowerCase().replace(/\s+/g, '.');
    const userRole = (role && (role.toLowerCase().includes('manager') || role.toLowerCase().includes('head') || role.toLowerCase().includes('director'))) 
      ? 'Manager' 
      : 'Employee';

    try {
      const existingUser = finalEmail
        ? (db.prepare('SELECT id FROM users WHERE employee_id = ? OR LOWER(email) = LOWER(?)').get(id, finalEmail) as any)
        : (db.prepare('SELECT id FROM users WHERE employee_id = ?').get(id) as any);

      if (!existingUser) {
        db.prepare(`
          INSERT INTO users (id, username, name, email, role, status, employee_id, department_name, avatar, two_factor_enabled, permissions, password, last_login, created_at)
          VALUES (?, ?, ?, ?, ?, 'Active', ?, ?, ?, 0, 'self_service,clock_in,request_leave,view_payslips', '@9218njo0(TWp<3q"(3{', 'Just now', ?)
          ON CONFLICT (id) DO NOTHING
        `).run(
          `usr-${id}`,
          calculatedUsername,
          `${first_name} ${last_name}`.trim(),
          finalEmail,
          userRole,
          id,
          newEmployee?.department_name || 'ទូទៅ (General)',
          finalAvatar,
          createdAt.split('T')[0]
        );
      } else {
        db.prepare('UPDATE users SET username = ?, department_name = ?, name = ? WHERE id = ?').run(
          calculatedUsername,
          newEmployee?.department_name || 'ទូទៅ (General)',
          `${first_name} ${last_name}`.trim(),
          existingUser.id
        );
      }
    } catch (userProvisionErr) {
      console.warn('Notice: user account provisioning warning (non-fatal):', userProvisionErr);
    }

    // Automatically create initial payroll record for active period so employee appears in Payroll & NSSF immediately
    if (newEmployee && !isBoardMember(newEmployee)) {
      try {
        const activePeriod = (db.prepare(`
          SELECT id, name FROM payroll_periods WHERE status != 'Locked' ORDER BY id DESC LIMIT 1
        `).get() as any) || { id: 'period-2026-10', name: 'October 2026' };

        const rules = getPayrollRules();
        const payrollResult = computeEmployeePayroll(newEmployee, activePeriod.id, activePeriod.name, {
          rulesConfig: rules,
          absentDays: 0,
          unpaidDays: 0,
          halfDays: 0,
          overtimeHours: 0,
        });

        const p = payrollResult.payroll;
        db.prepare(`
          INSERT INTO payrolls (
            id, employee_id, pay_period, payment_date, base_salary, allowances, bonuses,
            tax_deduction, insurance_deduction, other_deductions, net_salary, status,
            payment_method, created_at, working_days, absent_days, unpaid_days,
            basic_working_salary, seniority_bonus, position_allowance, sewing_skill_matrix,
            skill_allowance, transport_housing, attendance_allowance, food_allowance,
            overtime_pay, overtime_food, achievement_bonus, monthly_eval_bonus, annual_leave,
            salary_adjustment, gross_salary, non_taxable_amount, taxable_salary_usd,
            taxable_salary_khr, pension_usd, pension_khr, dependents_count, taxable_base_khr,
            tax_rate, tax_khr, tax_usd, after_tax_salary, first_paid, target_bonus,
            severance_pay, seniority_payback, paid_final_salary,
            second_paid, total_paid, labor_type, exchange_rate_khr, nssf_rate_khr,
            calculation_trace, period_id
          ) VALUES (
            @id, @employee_id, @pay_period, @payment_date, @base_salary, @allowances, @bonuses,
            @tax_deduction, @insurance_deduction, @other_deductions, @net_salary, @status,
            @payment_method, @created_at, @working_days, @absent_days, @unpaid_days,
            @basic_working_salary, @seniority_bonus, @position_allowance, @sewing_skill_matrix,
            @skill_allowance, @transport_housing, @attendance_allowance, @food_allowance,
            @overtime_pay, @overtime_food, @achievement_bonus, @monthly_eval_bonus, @annual_leave,
            @salary_adjustment, @gross_salary, @non_taxable_amount, @taxable_salary_usd,
            @taxable_salary_khr, @pension_usd, @pension_khr, @dependents_count, @taxable_base_khr,
            @tax_rate, @tax_khr, @tax_usd, @after_tax_salary, @first_paid, @target_bonus,
            @severance_pay, @seniority_payback, @paid_final_salary,
            @second_paid, @total_paid, @labor_type, @exchange_rate_khr, @nssf_rate_khr,
            @calculation_trace, @period_id
          )
          ON CONFLICT(id) DO UPDATE SET
            base_salary = excluded.base_salary,
            seniority_bonus = excluded.seniority_bonus,
            net_salary = excluded.net_salary,
            gross_salary = excluded.gross_salary
        `).run({
          ...p,
          status: 'Processing',
          payment_method: 'Direct Deposit',
          created_at: new Date().toISOString(),
          other_deductions: 0,
        });
      } catch (payErr) {
        console.error('Error auto-creating initial payroll record for new employee:', payErr);
      }
    }

    return NextResponse.json(newEmployee, { status: 201 });
  } catch (error: any) {
    console.error('Error creating employee:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { getDb, clearAllEmployees } = await import('@/lib/db');
    const db = getDb();
    clearAllEmployees(db);
    return NextResponse.json({ success: true, message: 'All employees and related records have been removed.' });
  } catch (error: any) {
    console.error('Error clearing employees:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

