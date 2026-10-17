import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { cleanEnglishOnly, parseDateToISO } from '@/lib/translations';
import { calculateSeniorityAllowanceFromDate } from '@/lib/payrollRules';

export const dynamic = 'force-dynamic';

export interface IncomingEmployee {
  id?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  phone?: string;
  role?: string;
  group_name?: string;
  group_id?: string;
  department?: string;
  department_id?: string;
  employee_type?: string; // "Type"
  status?: string;
  meal_allowance?: number | string;
  housing_transport_allowance?: number | string;
  housing_allowance?: number | string;
  skill_allowance?: number | string;
  nationality?: string;
  transport_allowance?: number | string;
  dob?: string; // "Date of Birth"
  salary?: number | string;
  location?: string;
  join_date?: string;
  employment_type?: string; // "Employment Type"
  // Extra / optional fields
  email?: string;
  gender?: string;
  avatar?: string;
  marital_status?: string;
  national_id?: string;
  current_address?: string;
  contract_type?: string;
  bank_name?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  nssf_member?: string;
  nssf_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

// Delimiter auto-detecting and RFC 4180 CSV / TSV parser
export function parseCSV(csvText: string): Record<string, string>[] {
  const cleanText = csvText.replace(/^\uFEFF/, '').trim();
  if (!cleanText) return [];

  // Auto-detect delimiter: tab or comma
  const firstLine = cleanText.split(/\r\n|\r|\n/)[0] || '';
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const delimiter = tabCount > commaCount ? '\t' : ',';

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField.trim());
      if (currentRow.some((field) => field.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((field) => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.toLowerCase().trim().replace(/[\s_\-\(\)\$\/]+/g, ''));
  const results: Record<string, string>[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const item: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      const headerKey = headers[c];
      const val = row[c] !== undefined ? row[c].trim() : '';
      item[headerKey] = val;
    }
    results.push(item);
  }

  return results;
}

// Clean numeric helper
export function parseNumeric(val: any, fallback: number = 0): number {
  if (val === undefined || val === null || val === '') return fallback;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  if (!cleaned || isNaN(Number(cleaned))) return fallback;
  return Number(cleaned);
}

// Normalize employee_type (Type)
export function normalizeEmployeeType(val: string): string {
  if (!val) return 'បុគ្គលិកពេញសិទ្ធិ (Regular / Permanent)';
  const lower = val.toLowerCase();
  if (lower.includes('regular') || lower.includes('permanent') || lower.includes('ពេញសិទ្ធិ')) {
    return 'បុគ្គលិកពេញសិទ្ធិ (Regular / Permanent)';
  }
  if (lower.includes('contract') || lower.includes('កិច្ចសន្យា')) {
    return 'បុគ្គលិកកិច្ចសន្យា (Contractual)';
  }
  if (lower.includes('probat') || lower.includes('សាកល្បង')) {
    return 'បុគ្គលិកសាកល្បង (Probationary)';
  }
  if (lower.includes('intern') || lower.includes('កម្មសិក្សា')) {
    return 'កម្មសិក្សាការី (Internship)';
  }
  if (lower.includes('board') || lower.includes('director') || lower.includes('ក្រុមប្រឹក្សា')) {
    return 'សមាជិកក្រុមប្រឹក្សាភិបាល (Board of Directors)';
  }
  return val;
}

// Normalize employment_type (Employment Type)
export function normalizeEmploymentType(val: string): string {
  if (!val) return 'ពេញម៉ោង (Full-Time)';
  const lower = val.toLowerCase();
  if (lower.includes('part') || lower.includes('ក្រៅម៉ោង')) {
    return 'ក្រៅម៉ោង (Part-Time)';
  }
  if (lower.includes('contract') || lower.includes('កិច្ចសន្យា')) {
    return 'កិច្ចសន្យា (Contract)';
  }
  if (lower.includes('full') || lower.includes('ពេញម៉ោង')) {
    return 'ពេញម៉ោង (Full-Time)';
  }
  return val;
}

// Helper: Normalize incoming CSV record to standard Employee fields
export function normalizeRecord(raw: Record<string, any>): IncomingEmployee {
  const getVal = (...keys: string[]): string => {
    for (const key of keys) {
      const normalizedKey = key.toLowerCase().replace(/[\s_\-\(\)\$\/]+/g, '');
      for (const rawKey of Object.keys(raw)) {
        if (rawKey.toLowerCase().replace(/[\s_\-\(\)\$\/]+/g, '') === normalizedKey) {
          if (raw[rawKey] !== undefined && raw[rawKey] !== null) {
            return String(raw[rawKey]).trim();
          }
        }
      }
    }
    return '';
  };

  let firstName = getVal('first_name', 'firstname', 'fname', 'ឈ្មោះ', 'នាម');
  let lastName = getVal('last_name', 'lastname', 'lname', 'ត្រកូល', 'គោត្តនាម');
  const fullName = getVal('name', 'fullname', 'employeename', 'ឈ្មោះពេញ');

  if (!firstName && fullName) {
    const parts = fullName.split(/\s+/);
    if (parts.length === 1) {
      firstName = parts[0];
      lastName = '';
    } else {
      // In Cambodia: First part is often Family name, second is given name
      lastName = parts[0];
      firstName = parts.slice(1).join(' ');
    }
  }

  // 19 requested columns:
  // 1. ID
  const id = getVal('id', 'employee_id', 'empid', 'code', 'អត្តលេខ');
  // 2. First Name (firstName)
  // 3. Last Name (lastName)
  // 4. Phone Number
  const phone = getVal('phone_number', 'phonenumber', 'phone', 'mobile', 'tel', 'telephone', 'លេខទូរស័ព្ទ', 'ទូរស័ព្ទ');
  // 5. Role
  const role = getVal('role', 'position', 'job_title', 'title', 'មុខតំណែង', 'តួនាទី');
  // 6. Group / Line
  const group_name = getVal('group_line', 'groupline', 'group', 'line', 'group_name', 'ក្រុម', 'ខ្សែសង្វាក់');
  // 7. Department
  const department = getVal('department', 'department_name', 'dept', 'division', 'នាយកដ្ឋាន', 'ផ្នែក');
  const department_id = getVal('department_id', 'dept_id');
  // 8. Type (employee_type)
  const rawType = getVal('type', 'employee_type', 'employeetype', 'staff_type', 'ប្រភេទបុគ្គលិក');
  const employee_type = normalizeEmployeeType(rawType);
  // 9. Status
  const status = getVal('status', 'state', 'ស្ថានភាព') || 'Active';
  // 10. Meal Allowance ($)
  const meal_allowance = parseNumeric(getVal('meal_allowance_$', 'meal_allowance', 'mealallowance', 'meal', 'ប្រាក់ថ្លៃបាយ'), 0);
  // 11. Housing - Transport Allowance ($)
  const rawHousingTransport = getVal(
    'housing_-_transport_allowance_$',
    'housing_transport_allowance_$',
    'housing_transport_allowance',
    'housingtransportallowance',
    'housing_-_transport_allowance',
    'housing_transport',
    'transport_-_housing_allowance_$',
    'transport_housing_allowance_$',
    'transport_housing_allowance',
    'transporthousingallowance',
    'transport_housing',
    'ថ្លៃស្នាក់នៅ_និង_ធ្វើដំណើរ',
    'ថ្លៃស្នាក់នៅ_ធ្វើដំណើរ'
  );

  let housing_transport_allowance = 0;
  if (rawHousingTransport !== '') {
    housing_transport_allowance = parseNumeric(rawHousingTransport, 0);
  } else {
    // Backward compatibility if separate columns are uploaded
    const legHousing = parseNumeric(getVal('housing_allowance_$', 'housing_allowance', 'housingallowance', 'housing', 'ប្រាក់ថ្លៃស្នាក់នៅ'), 0);
    const legTransport = parseNumeric(getVal('transport_allowance_$', 'transport_allowance', 'transportallowance', 'transport', 'ប្រាក់ធ្វើដំណើរ'), 0);
    housing_transport_allowance = legHousing + legTransport;
  }

  // 12. Skill Allowance ($)
  const skill_allowance = parseNumeric(getVal('skill_allowance_$', 'skill_allowance', 'skillallowance', 'skill', 'ប្រាក់ជំនាញ'), 0);
  // 13. Nationality (Strictly English)
  const nationality = cleanEnglishOnly(getVal('nationality', 'សញ្ជាតិ')) || 'Cambodian';
  // 14. Date of Birth
  const dob = parseDateToISO(getVal('date_of_birth', 'dateofbirth', 'dob', 'birthdate', 'ថ្ងៃខែឆ្នាំកំណើត'));
  // 15. Salary
  const salary = parseNumeric(getVal('salary', 'base_salary', 'compensation', 'ប្រាក់បៀវត្សរ៍', 'ប្រាក់ខែ'), 1200);
  // 16. Location (Strictly English)
  const location = cleanEnglishOnly(getVal('location', 'branch', 'city', 'province', 'ទីតាំង', 'សាខា')) || 'Phnom Penh';
  // 17. Join Date
  const rawJoinDate = getVal('join_date', 'joindate', 'start_date', 'hire_date', 'date_joined', 'ថ្ងៃចូលបម្រើការងារ');
  const join_date = parseDateToISO(rawJoinDate) || new Date().toISOString().split('T')[0];
  // 18. Employment Type
  const rawEmploymentType = getVal('employment_type', 'employmenttype', 'emp_type', 'ប្រភេទការងារ');
  const employment_type = normalizeEmploymentType(rawEmploymentType);

  return {
    id,
    first_name: firstName,
    last_name: lastName || '-',
    phone,
    role,
    group_name,
    department,
    department_id,
    employee_type,
    status,
    meal_allowance,
    housing_transport_allowance,
    housing_allowance: housing_transport_allowance,
    transport_allowance: 0,
    skill_allowance,
    nationality,
    dob,
    salary,
    location,
    join_date,
    employment_type,
    // Optional extras
    email: getVal('email', 'e-mail', 'mail', 'អ៊ីមែល'),
    gender: getVal('gender', 'sex', 'ភេទ') || 'ប្រុស (Male)',
    marital_status: getVal('marital_status', 'ស្ថានភាពអាពាហ៍ពិពាហ៍') || 'នៅលីវ (Single)',
    national_id: getVal('national_id', 'id_card', 'អត្តសញ្ញាណប័ណ្ណ'),
    current_address: getVal('current_address', 'address', 'អាសយដ្ឋាន'),
    contract_type: getVal('contract_type', 'ប្រភេទកិច្ចសន្យា') || 'UDC (មិនកំណត់ថិរវេលា)',
    bank_name: getVal('bank_name', 'bank', 'ធនាគារ') || 'ABA Bank',
    bank_account_name: getVal('bank_account_name', 'account_name', 'ឈ្មោះគណនី'),
    bank_account_number: getVal('bank_account_number', 'account_number', 'account_no', 'លេខគណនី'),
    nssf_member: getVal('nssf_member', 'nssf', 'ប.ស.ស') || 'មាន (Yes)',
    nssf_number: getVal('nssf_number', 'nssf_id', 'លេខប.ស.ស'),
    emergency_contact_name: getVal('emergency_contact_name', 'emergency_name', 'ទំនាក់ទំនងអាសន្ន'),
    emergency_contact_phone: getVal('emergency_contact_phone', 'emergency_phone', 'ទូរស័ព្ទអាសន្ន'),
  };
}

// GET: Serve sample CSV Template with exactly the 18 requested columns
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isTemplate = searchParams.get('template') === '1';

  if (isTemplate) {
    const csvHeader = 'ID,First Name,Last Name,Phone Number,Role,Group / Line,Department,Type,Status,Meal Allowance ($),Housing - Transport Allowance ($),Skill Allowance ($),Nationality,Date of Birth,Salary,Location,Join Date,Employment Type';
    const sampleRows = [
      'EMP-2026-001,Sokha,Meas,012 345 678,Senior Accountant,,Finance & Accounting,Regular / Permanent,Active,20,25,0,Cambodian,12/05/1995,1400,Phnom Penh,15/01/2026,Full-Time',
      'EMP-2026-002,Dara,Khim,098 765 432,Full-Stack Engineer,,Information Technology,Regular / Permanent,Active,25,35,50,Cambodian,20/08/1992,1800,Phnom Penh,01/02/2026,Full-Time',
      'EMP-2026-003,Sopheap,Rath,087 112 233,Sewing Operator,Sewing Line 1,Production,Regular / Permanent,Active,15,20,20,Cambodian,04/11/1998,320,Phnom Penh,15/02/2026,Full-Time',
      'EMP-2026-004,Chenda,Kong,077 445 566,QC Inspector,Quality Control,Production,Regular / Permanent,Active,15,20,30,Cambodian,25/03/1996,350,Phnom Penh,01/03/2026,Full-Time',
    ];

    // Prepend UTF-8 BOM so Excel opens with proper character rendering
    const content = '\uFEFF' + [csvHeader, ...sampleRows].join('\r\n');

    return new Response(content, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="hestra_hrm_employee_import_template.csv"',
      },
    });
  }

  return NextResponse.json({ message: 'Employee Import API ready. Use POST to upload.' });
}

// POST: Process batch employee import
export async function POST(request: Request) {
  try {
    const db = getDb();
    let recordsToProcess: IncomingEmployee[] = [];

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      if (Array.isArray(body.employees)) {
        recordsToProcess = body.employees.map((item: any) => normalizeRecord(item));
      } else if (typeof body.csv === 'string') {
        const parsed = parseCSV(body.csv);
        recordsToProcess = parsed.map((item) => normalizeRecord(item));
      }
    } else if (contentType.includes('text/csv') || contentType.includes('text/plain')) {
      const rawText = await request.text();
      const parsed = parseCSV(rawText);
      recordsToProcess = parsed.map((item) => normalizeRecord(item));
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      if (file && typeof file === 'object' && 'text' in file) {
        const fileText = await (file as any).text();
        const parsed = parseCSV(fileText);
        recordsToProcess = parsed.map((item) => normalizeRecord(item));
      }
    }

    if (!recordsToProcess || recordsToProcess.length === 0) {
      return NextResponse.json(
        { error: 'No valid employee records found in the import payload.' },
        { status: 400 }
      );
    }

    // 1. Load existing departments for auto-matching
    const existingDepts = db.prepare('SELECT id, name FROM departments').all() as { id: string; name: string }[];
    const deptMap: Record<string, string> = {};
    for (const d of existingDepts) {
      deptMap[d.id.toLowerCase()] = d.id;
      deptMap[d.name.toLowerCase()] = d.id;
      const match = d.name.match(/\((.*?)\)/);
      if (match) {
        deptMap[match[1].toLowerCase()] = d.id;
      }
      const khmerPart = d.name.split('(')[0].trim().toLowerCase();
      if (khmerPart) {
        deptMap[khmerPart] = d.id;
      }
    }
    const defaultDeptId = existingDepts.length > 0 ? existingDepts[0].id : 'dept-prod';

    // 2. Load existing employee groups / lines for auto-matching
    const existingGroups = db.prepare('SELECT id, name, department_id FROM employee_groups').all() as { id: string; name: string; department_id?: string }[];
    const groupMap: Record<string, { id: string; name: string }> = {};
    for (const g of existingGroups) {
      groupMap[g.id.toLowerCase()] = { id: g.id, name: g.name };
      groupMap[g.name.toLowerCase()] = { id: g.id, name: g.name };
    }

    let importedCount = 0;
    let updatedCount = 0;
    const errors: { row: number; reason: string; data?: any }[] = [];
    const createdEmployees: any[] = [];

    // Prepared statements
    const checkEmployeeStmt = db.prepare('SELECT id FROM employees WHERE id = ? OR (email IS NOT NULL AND email != \'\' AND LOWER(email) = LOWER(?))');

    // 61 Columns insert statement exactly matching DB schema
    const insertEmployeeStmt = db.prepare(`
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

    const updateEmployeeStmt = db.prepare(`
      UPDATE employees SET
        first_name = ?, last_name = ?, phone = ?, role = ?, department_id = ?,
        group_name = ?, group_id = ?,
        employee_type = ?, status = ?,
        meal_allowance = ?, housing_allowance = ?, skill_allowance = ?, nationality = ?,
        transport_allowance = ?, dob = ?, salary = ?, location = ?, join_date = ?,
        employment_type = ?
      WHERE id = ?
    `);

    const insertLeaveBalStmt = db.prepare(`
      INSERT OR IGNORE INTO leave_balances (id, employee_id, annual_total, annual_used, sick_total, sick_used, casual_total, casual_used)
      VALUES (?, ?, 20, 0, 10, 0, 5, 0)
    `);

    const insertUserStmt = db.prepare(`
      INSERT OR IGNORE INTO users (id, username, name, email, role, status, employee_id, department_name, avatar, two_factor_enabled, permissions, password, last_login, created_at)
      VALUES (?, ?, ?, ?, ?, 'Active', ?, ?, ?, 0, 'self_service,clock_in,request_leave,view_payslips', '@9218njo0(TWp<3q"(3{', 'Imported', ?)
    `);

    const insertDeptStmt = db.prepare(`
      INSERT INTO departments (id, name, description, manager_id, color)
      VALUES (?, ?, ?, NULL, ?)
    `);

    const insertGroupStmt = db.prepare(`
      INSERT INTO employee_groups (id, name, department_id, description, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    // Department color palette
    const deptColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'];

    // Process all records in a single database transaction
    const transaction = db.transaction(() => {
      for (let i = 0; i < recordsToProcess.length; i++) {
        const rec = recordsToProcess[i];
        const rowNum = i + 1;

        if (!rec.first_name || !rec.first_name.trim()) {
          errors.push({ row: rowNum, reason: 'First Name is required', data: rec });
          continue;
        }
        if (!rec.role || !rec.role.trim()) {
          errors.push({ row: rowNum, reason: 'Role / Job Title is required', data: rec });
          continue;
        }

        // 1. Resolve Department
        let finalDeptId = defaultDeptId;
        const deptInput = (rec.department_id || rec.department || '').trim();
        if (deptInput) {
          const lowerInput = deptInput.toLowerCase();
          if (deptMap[lowerInput]) {
            finalDeptId = deptMap[lowerInput];
          } else {
            const foundKey = Object.keys(deptMap).find(
              (k) => lowerInput.includes(k) || k.includes(lowerInput)
            );
            if (foundKey) {
              finalDeptId = deptMap[foundKey];
            } else {
              // Auto-create newly referenced department
              const newDeptId = `dept-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`;
              const randomColor = deptColors[Math.floor(Math.random() * deptColors.length)];
              try {
                insertDeptStmt.run(newDeptId, deptInput, 'Auto-created during bulk employee import', randomColor);
                deptMap[lowerInput] = newDeptId;
                finalDeptId = newDeptId;
              } catch (e) {
                finalDeptId = defaultDeptId;
              }
            }
          }
        }

        // 2. Resolve Group / Line
        let finalGroupId: string | null = null;
        let finalGroupName: string | null = null;
        const groupInput = (rec.group_name || rec.group_id || '').trim();
        if (groupInput) {
          const lowerGroup = groupInput.toLowerCase();
          if (groupMap[lowerGroup]) {
            finalGroupId = groupMap[lowerGroup].id;
            finalGroupName = groupMap[lowerGroup].name;
          } else {
            // Auto-create newly referenced group
            const newGroupId = `grp-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;
            try {
              insertGroupStmt.run(
                newGroupId,
                groupInput,
                finalDeptId,
                'Auto-created during bulk employee import',
                new Date().toISOString().replace('T', ' ').substring(0, 19)
              );
              groupMap[lowerGroup] = { id: newGroupId, name: groupInput };
              finalGroupId = newGroupId;
              finalGroupName = groupInput;
            } catch (e) {
              finalGroupId = null;
              finalGroupName = groupInput;
            }
          }
        }

        const numSalary = parseNumeric(rec.salary, 1200);
        const numMealAllowance = parseNumeric(rec.meal_allowance, 0);
        const numHousingAllowance = parseNumeric(
          rec.housing_transport_allowance ?? (parseNumeric(rec.housing_allowance, 0) + parseNumeric(rec.transport_allowance, 0)),
          0
        );
        const numSkillAllowance = parseNumeric(rec.skill_allowance, 0);
        const numTransportAllowance = 0;

        const assignedAvatar = (rec.avatar && typeof rec.avatar === 'string' && rec.avatar.trim()) ? rec.avatar.trim() : '';
        const finalEmail = rec.email && rec.email.trim() ? rec.email.trim() : null;
        const finalJoinDate = parseDateToISO(rec.join_date) || new Date().toISOString().split('T')[0];
        const finalLocation = cleanEnglishOnly(rec.location) || 'Phnom Penh';
        const finalNationality = cleanEnglishOnly(rec.nationality) || 'Cambodian';
        const finalDob = parseDateToISO(rec.dob) || (rec.dob || '').trim();
        const finalPhone = (rec.phone || '').trim();
        const finalEmpType = normalizeEmployeeType(rec.employee_type || '');
        const finalEmploymentType = normalizeEmploymentType(rec.employment_type || '');
        const finalStatus = (rec.status || 'Active').trim();
        const createdAt = new Date().toISOString();

        // Check if employee already exists
        const existing = rec.id || finalEmail ? (checkEmployeeStmt.get(rec.id || '', finalEmail || '') as any) : null;

        if (existing) {
          // Update existing employee
          updateEmployeeStmt.run(
            rec.first_name,
            rec.last_name || '-',
            finalPhone,
            rec.role,
            finalDeptId,
            finalGroupName,
            finalGroupId,
            finalEmpType,
            finalStatus,
            numMealAllowance,
            numHousingAllowance,
            numSkillAllowance,
            finalNationality,
            numTransportAllowance,
            finalDob,
            numSalary,
            finalLocation,
            finalJoinDate,
            finalEmploymentType,
            existing.id
          );
          updatedCount++;
          createdEmployees.push({ id: existing.id, first_name: rec.first_name, last_name: rec.last_name, updated: true });
        } else {
          // Generate new ID if not provided
          const empId = rec.id && rec.id.trim() ? rec.id.trim() : `EMP-2026-${String(Date.now()).slice(-4)}${i + 1}`;

          insertEmployeeStmt.run(
            empId,
            rec.first_name,
            rec.last_name || '-',
            null, // khmer_name
            finalEmail,
            finalPhone,
            rec.role,
            finalDeptId,
            finalEmploymentType,
            finalEmpType,
            finalStatus,
            numSalary,
            finalJoinDate,
            null, // manager_id
            assignedAvatar,
            finalLocation,
            'Auto-imported employee record',
            rec.emergency_contact_name || '',
            rec.emergency_contact_phone || '',
            rec.gender || 'ប្រុស (Male)',
            finalDob,
            finalNationality,
            rec.marital_status || 'នៅលីវ (Single)',
            rec.national_id || '',
            rec.current_address || '',
            finalLocation,
            '', '', '',
            rec.contract_type || 'UDC (មិនកំណត់ថិរវេលា)',
            finalJoinDate,
            '',
            'Head Office',
            'USD ($)',
            'កន្លះខែ (Semi-monthly)',
            rec.bank_name || 'ABA Bank',
            rec.bank_account_name || `${rec.first_name} ${rec.last_name}`,
            rec.bank_account_number || '',
            rec.nssf_member || 'មាន (Yes)',
            rec.nssf_number || '',
            finalJoinDate,
            '', '',
            '', '', '', '',
            numTransportAllowance,
            numMealAllowance,
            numHousingAllowance,
            0, // attendance_allowance
            numSkillAllowance,
            calculateSeniorityAllowanceFromDate(finalJoinDate).allowance, // seniority_bonus auto-calculated from join_date
            0, // position_allowance
            0, // sewing_skill_matrix
            'Direct Labour',
            0, // working_period
            'Grade 2',
            finalGroupName,
            finalGroupId,
            createdAt
          );

          // Initialize leave balances
          insertLeaveBalStmt.run(`bal-${empId}`, empId);

          // Provision user login safely
          const cleanEmpId = empId.toLowerCase().replace(/[^a-z0-9]/g, '');
          const cleanName = rec.first_name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'emp';
          const cleanUsername = `${cleanName}.${cleanEmpId}`;
          const isManager = rec.role.toLowerCase().includes('manager') || rec.role.toLowerCase().includes('head') || rec.role.toLowerCase().includes('director');
          const userRole = isManager ? 'Manager' : 'Employee';
          const userEmail = finalEmail || `${cleanEmpId}@hrm.local`;

          insertUserStmt.run(
            `usr-${Date.now().toString().slice(-6)}${i}`,
            cleanUsername,
            `${rec.first_name} ${rec.last_name || ''}`.trim(),
            userEmail,
            userRole,
            empId,
            rec.department || 'Production',
            assignedAvatar,
            createdAt.split('T')[0]
          );

          importedCount++;
          createdEmployees.push({ id: empId, first_name: rec.first_name, last_name: rec.last_name, updated: false });
        }
      }
    });

    transaction();

    return NextResponse.json({
      success: true,
      importedCount,
      updatedCount,
      totalProcessed: recordsToProcess.length,
      errors,
      createdEmployees,
    });
  } catch (error: any) {
    console.error('Error importing employees:', error);
    return NextResponse.json({ error: error.message || 'Internal import error' }, { status: 500 });
  }
}
