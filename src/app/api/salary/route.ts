import { NextResponse } from 'next/server';
import { getDb, getPayrollRules } from '@/lib/db';
import { SalaryOverview, SalaryAdjustment, isBoardMember } from '@/lib/types';
import { calculateSeniorityAllowanceFromDate } from '@/lib/payrollRules';

export const dynamic = 'force-dynamic';

// Official Cambodia 2026 Statutory Minimum Wage (Prakas - Ministry of Labour & Vocational Training)
const CAMBODIA_MIN_WAGE_USD = 208;

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department') || '';
    const payGrade = searchParams.get('grade') || '';
    const q = searchParams.get('q') || '';

    // 1. Query all employees with compensation details
    let sql = `
      SELECT 
        e.id,
        e.first_name,
        e.last_name,
        e.email,
        e.phone,
        e.role,
        e.department_id,
        d.name as department_name,
        e.avatar,
        e.status,
        e.salary,
        e.employee_type,
        e.employment_type,
        e.salary_currency,
        e.salary_frequency,
        e.contract_type,
        e.contract_start,
        e.contract_end,
        e.join_date,
        e.bank_name,
        e.bank_account_name,
        e.bank_account_number,
        e.nssf_member,
        e.nssf_number,
        COALESCE(e.transport_allowance, 0) as transport_allowance,
        COALESCE(e.meal_allowance, 0) as meal_allowance,
        COALESCE(e.housing_allowance, 0) as housing_allowance,
        COALESCE(e.attendance_allowance, 0) as attendance_allowance,
        COALESCE(e.skill_allowance, 0) as skill_allowance,
        COALESCE(e.seniority_bonus, 0) as seniority_bonus,
        COALESCE(e.pay_grade, 'Grade 2') as pay_grade,
        e.last_salary_review
      FROM employees e
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE e.status != 'Terminated'
    `;

    const params: any[] = [];

    if (department && department !== 'all') {
      sql += ` AND e.department_id = ?`;
      params.push(department);
    }

    if (payGrade && payGrade !== 'all') {
      sql += ` AND e.pay_grade = ?`;
      params.push(payGrade);
    }

    if (q) {
      sql += ` AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.role LIKE ? OR d.name LIKE ? OR e.id LIKE ?)`;
      const pattern = `%${q}%`;
      params.push(pattern, pattern, pattern, pattern, pattern);
    }

    sql += ` ORDER BY e.salary DESC, e.first_name ASC`;

    const rawEmployees = db.prepare(sql).all(...params) as any[];

    const employees = rawEmployees.map((emp) => {
      const totalAllowances =
        Number(emp.transport_allowance || 0) +
        Number(emp.meal_allowance || 0) +
        Number(emp.housing_allowance || 0) +
        Number(emp.attendance_allowance || 0) +
        Number(emp.skill_allowance || 0) +
        Number(emp.seniority_bonus || 0);

      const isBoard = isBoardMember(emp);
      const grossSalary = Number(emp.salary || 0) + totalAllowances;
      // Board of Directors members are exempt from statutory minimum wage check
      const isCompliant = isBoard ? true : Number(emp.salary || 0) >= CAMBODIA_MIN_WAGE_USD;

      return {
        ...emp,
        housing_transport_allowance: Number(emp.housing_allowance || 0) + Number(emp.transport_allowance || 0),
        name: `${emp.first_name} ${emp.last_name}`,
        totalAllowances,
        grossSalary,
        isCompliant,
        isBoardExempt: isBoard,
      };
    });

    // 2. Aggregate statistics across all active staff (excluding Board members who are exempt from salary)
    const allActive = db.prepare(`
      SELECT 
        e.salary,
        e.department_id,
        d.name as department_name,
        e.role,
        e.employee_type,
        e.employment_type,
        COALESCE(e.transport_allowance, 0) as transport_allowance,
        COALESCE(e.meal_allowance, 0) as meal_allowance,
        COALESCE(housing_allowance, 0) as housing_allowance,
        COALESCE(attendance_allowance, 0) as attendance_allowance,
        COALESCE(e.skill_allowance, 0) as skill_allowance,
        COALESCE(seniority_bonus, 0) as seniority_bonus,
        COALESCE(e.pay_grade, 'Grade 2') as pay_grade
      FROM employees e
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE e.status != 'Terminated'
    `).all() as any[];

    let totalMonthlySalary = 0;
    let totalAllowances = 0;
    let minSalary = Infinity;
    let maxSalary = 0;
    let compliantCount = 0;
    let nonCompliantCount = 0;

    const gradeDistribution: Record<string, number> = {
      'Grade 1': 0,
      'Grade 2': 0,
      'Grade 3': 0,
      'Grade 4': 0,
      'Grade 5': 0,
    };

    const regularStaff = allActive.filter((item) => !isBoardMember(item));

    regularStaff.forEach((item) => {
      const s = Number(item.salary) || 0;
      totalMonthlySalary += s;
      const alw =
        Number(item.transport_allowance || 0) +
        Number(item.meal_allowance || 0) +
        Number(item.housing_allowance || 0) +
        Number(item.attendance_allowance || 0) +
        Number(item.skill_allowance || 0) +
        Number(item.seniority_bonus || 0);
      totalAllowances += alw;

      if (s < minSalary) minSalary = s;
      if (s > maxSalary) maxSalary = s;

      if (s >= CAMBODIA_MIN_WAGE_USD) {
        compliantCount++;
      } else {
        nonCompliantCount++;
      }

      const g = item.pay_grade || 'Grade 2';
      if (gradeDistribution[g] !== undefined) {
        gradeDistribution[g]++;
      } else {
        gradeDistribution[g] = 1;
      }
    });

    const totalCount = regularStaff.length;
    const averageSalary = totalCount > 0 ? Math.round((totalMonthlySalary / totalCount) * 100) / 100 : 0;
    if (minSalary === Infinity) minSalary = 0;

    const overview: SalaryOverview = {
      totalMonthlySalary,
      totalAllowances,
      averageSalary,
      minSalary,
      maxSalary,
      compliantCount,
      nonCompliantCount,
      totalEmployees: totalCount,
      minWageStandard: CAMBODIA_MIN_WAGE_USD,
    };

    // 3. Query Recent Salary Adjustments History
    const adjustmentsSql = `
      SELECT 
        sa.*,
        e.first_name || ' ' || e.last_name as employee_name,
        e.role as employee_role,
        e.avatar as employee_avatar,
        d.name as department_name
      FROM salary_adjustments sa
      JOIN employees e ON e.id = sa.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
      ORDER BY sa.effective_date DESC, sa.created_at DESC
      LIMIT 50
    `;
    const adjustments = db.prepare(adjustmentsSql).all() as SalaryAdjustment[];

    // 4. Department Compensation Breakdown
    const deptSalarySql = `
      SELECT 
        d.id,
        d.name,
        d.color,
        COUNT(e.id) as staff_count,
        COALESCE(SUM(e.salary), 0) as total_salary,
        COALESCE(AVG(e.salary), 0) as avg_salary
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id AND e.status != 'Terminated'
      GROUP BY d.id
      ORDER BY total_salary DESC
    `;
    const departmentBreakdown = db.prepare(deptSalarySql).all();

    return NextResponse.json({
      overview,
      employees,
      adjustments,
      gradeDistribution,
      departmentBreakdown,
    });
  } catch (error: any) {
    console.error('Error fetching salary management data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Record a salary adjustment and update employee compensation profile
export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();

    // Batch auto-calculation of seniority allowance for all employees based on join_date
    if (body.action === 'auto_calculate_seniority_all') {
      const rules = getPayrollRules();
      const tiers = rules?.seniority_tiers;
      const allEmps = db.prepare('SELECT id, join_date, seniority_bonus FROM employees').all() as any[];
      const updateStmt = db.prepare('UPDATE employees SET seniority_bonus = ? WHERE id = ?');
      let updatedCount = 0;
      const details: Array<{ id: string; join_date: string; old_bonus: number; new_bonus: number }> = [];

      db.transaction(() => {
        for (const emp of allEmps) {
          const { allowance } = calculateSeniorityAllowanceFromDate(emp.join_date, undefined, tiers);
          if (Number(emp.seniority_bonus || 0) !== allowance) {
            updateStmt.run(allowance, emp.id);
            updatedCount++;
            details.push({
              id: emp.id,
              join_date: emp.join_date,
              old_bonus: Number(emp.seniority_bonus || 0),
              new_bonus: allowance,
            });
          }
        }
      })();

      return NextResponse.json({
        success: true,
        total_employees: allEmps.length,
        updated_count: updatedCount,
        details,
        message: `Successfully recalculated seniority allowance for all employees (${updatedCount} updated).`,
      });
    }

    const {
      employee_id,
      new_salary,
      adjustment_type,
      effective_date,
      reason,
      approved_by,
      currency = 'USD ($)',
      pay_grade,
      transport_allowance,
      meal_allowance,
      housing_allowance,
      attendance_allowance,
      skill_allowance,
      seniority_bonus,
      bank_name,
      bank_account_name,
      bank_account_number,
    } = body;

    if (!employee_id) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    if (new_salary === undefined || new_salary === null || Number(new_salary) <= 0) {
      return NextResponse.json({ error: 'Valid base salary is required' }, { status: 400 });
    }

    // Fetch current employee record
    const employee = db.prepare('SELECT id, salary, pay_grade, bank_name, bank_account_name, bank_account_number FROM employees WHERE id = ?').get(employee_id) as any;
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const previousSalary = Number(employee.salary || 0);
    const newSalaryNum = Number(new_salary);
    const increaseAmount = Math.round((newSalaryNum - previousSalary) * 100) / 100;
    const increasePercentage = previousSalary > 0 
      ? Math.round(((newSalaryNum - previousSalary) / previousSalary) * 10000) / 100 
      : 0;

    const adjustmentId = `adj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const effectiveDateStr = effective_date || new Date().toISOString().split('T')[0];

    // Transaction to ensure atomicity
    const runTransaction = db.transaction(() => {
      // 1. Insert historical salary adjustment record
      const insertAdj = db.prepare(`
        INSERT INTO salary_adjustments (
          id, employee_id, previous_salary, new_salary, increase_amount,
          increase_percentage, effective_date, adjustment_type, currency,
          reason, approved_by, created_at
        ) VALUES (
          @id, @employee_id, @previous_salary, @new_salary, @increase_amount,
          @increase_percentage, @effective_date, @adjustment_type, @currency,
          @reason, @approved_by, @created_at
        )
      `);

      insertAdj.run({
        id: adjustmentId,
        employee_id,
        previous_salary: previousSalary,
        new_salary: newSalaryNum,
        increase_amount: increaseAmount,
        increase_percentage: increasePercentage,
        effective_date: effectiveDateStr,
        adjustment_type: adjustment_type || 'Merit Increase',
        currency,
        reason: reason || 'Compensation review and structure update',
        approved_by: approved_by || 'HR Administrator',
        created_at: new Date().toISOString(),
      });

      // 2. Update employee's active salary and compensation fields
      const updateEmp = db.prepare(`
        UPDATE employees
        SET 
          salary = @salary,
          salary_currency = @currency,
          pay_grade = COALESCE(@pay_grade, pay_grade),
          transport_allowance = COALESCE(@transport_allowance, transport_allowance),
          meal_allowance = COALESCE(@meal_allowance, meal_allowance),
          housing_allowance = COALESCE(@housing_allowance, housing_allowance),
          attendance_allowance = COALESCE(@attendance_allowance, attendance_allowance),
          skill_allowance = COALESCE(@skill_allowance, skill_allowance),
          seniority_bonus = COALESCE(@seniority_bonus, seniority_bonus),
          bank_name = COALESCE(@bank_name, bank_name),
          bank_account_name = COALESCE(@bank_account_name, bank_account_name),
          bank_account_number = COALESCE(@bank_account_number, bank_account_number),
          last_salary_review = @last_salary_review
        WHERE id = @id
      `);

      updateEmp.run({
        id: employee_id,
        salary: newSalaryNum,
        currency,
        pay_grade: pay_grade !== undefined ? pay_grade : null,
        transport_allowance: body.housing_transport_allowance !== undefined
          ? 0
          : (transport_allowance !== undefined ? Number(transport_allowance) : null),
        meal_allowance: meal_allowance !== undefined ? Number(meal_allowance) : null,
        housing_allowance: body.housing_transport_allowance !== undefined
          ? Number(body.housing_transport_allowance)
          : (housing_allowance !== undefined ? Number(housing_allowance) : null),
        attendance_allowance: attendance_allowance !== undefined ? Number(attendance_allowance) : null,
        skill_allowance: skill_allowance !== undefined ? Number(skill_allowance) : null,
        seniority_bonus: seniority_bonus !== undefined ? Number(seniority_bonus) : null,
        bank_name: bank_name !== undefined ? bank_name : null,
        bank_account_name: bank_account_name !== undefined ? bank_account_name : null,
        bank_account_number: bank_account_number !== undefined ? bank_account_number : null,
        last_salary_review: effectiveDateStr,
      });
    });

    runTransaction();

    return NextResponse.json({
      success: true,
      message: 'Salary adjustment recorded successfully',
      adjustmentId,
      previousSalary,
      newSalary: newSalaryNum,
      increaseAmount,
      increasePercentage,
    });
  } catch (error: any) {
    console.error('Error saving salary adjustment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
