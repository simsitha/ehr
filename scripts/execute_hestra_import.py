import json
import sqlite3
import datetime

def clean_num(val):
    if not val or val.strip() in ('', '-', '$-', '៛', '#REF!'):
        return 0.0
    s = val.strip().replace('$', '').replace('៛', '').replace(',', '').replace('KHR', '').replace(' ', '')
    if s.startswith('(') and s.endswith(')'):
        return -float(s[1:-1])
    try:
        return float(s)
    except:
        return 0.0

def convert_date(d_str):
    if not d_str or not d_str.strip():
        return None
    d_str = d_str.strip()
    parts = d_str.split('-')
    if len(parts) == 3:
        if len(parts[2]) == 4:
            return f"{parts[2]}-{parts[1]}-{parts[0]}"
        elif len(parts[0]) == 4:
            return d_str
    return d_str

# Read dataset from full transcript
with open('/root/.gemini/antigravity-cli/brain/99094a46-4af3-4fce-a2d5-6eb7812c3eb3/.system_generated/logs/transcript_full.jsonl') as f:
    data = json.loads(f.readline())

content = data.get('content', '')
lines = content.split('\n')
emp_lines = [l for l in lines if l.strip().startswith('HC')]

print(f"Reading {len(emp_lines)} employee records from user prompt...")

conn = sqlite3.connect('data/hr.db')
c = conn.cursor()

# 0. Ensure schema migrations
emp_cols = [c_info[1] for c_info in c.execute("PRAGMA table_info(employees)").fetchall()]
for col, c_type in [
    ('khmer_name', 'TEXT'),
    ('position_allowance', 'REAL DEFAULT 0'),
    ('sewing_skill_matrix', 'REAL DEFAULT 0'),
    ('labor_type', 'TEXT DEFAULT "Direct Labour"'),
    ('working_period', 'INTEGER DEFAULT 0')
]:
    if col not in emp_cols:
        c.execute(f"ALTER TABLE employees ADD COLUMN {col} {c_type}")

pay_cols = [c_info[1] for c_info in c.execute("PRAGMA table_info(payrolls)").fetchall()]
for col, c_type in [
    ('working_days', 'REAL DEFAULT 26'),
    ('absent_days', 'REAL DEFAULT 0'),
    ('unpaid_days', 'REAL DEFAULT 0'),
    ('basic_working_salary', 'REAL DEFAULT 0'),
    ('seniority_bonus', 'REAL DEFAULT 0'),
    ('position_allowance', 'REAL DEFAULT 0'),
    ('sewing_skill_matrix', 'REAL DEFAULT 0'),
    ('skill_allowance', 'REAL DEFAULT 0'),
    ('transport_housing', 'REAL DEFAULT 0'),
    ('attendance_allowance', 'REAL DEFAULT 0'),
    ('food_allowance', 'REAL DEFAULT 0'),
    ('overtime_pay', 'REAL DEFAULT 0'),
    ('overtime_food', 'REAL DEFAULT 0'),
    ('achievement_bonus', 'REAL DEFAULT 0'),
    ('monthly_eval_bonus', 'REAL DEFAULT 0'),
    ('annual_leave', 'REAL DEFAULT 0'),
    ('salary_adjustment', 'REAL DEFAULT 0'),
    ('gross_salary', 'REAL DEFAULT 0'),
    ('non_taxable_amount', 'REAL DEFAULT 0'),
    ('taxable_salary_usd', 'REAL DEFAULT 0'),
    ('taxable_salary_khr', 'REAL DEFAULT 0'),
    ('pension_usd', 'REAL DEFAULT 0'),
    ('pension_khr', 'REAL DEFAULT 0'),
    ('dependents_count', 'INTEGER DEFAULT 0'),
    ('taxable_base_khr', 'REAL DEFAULT 0'),
    ('tax_rate', 'TEXT DEFAULT "0%"'),
    ('tax_khr', 'REAL DEFAULT 0'),
    ('tax_usd', 'REAL DEFAULT 0'),
    ('after_tax_salary', 'REAL DEFAULT 0'),
    ('first_paid', 'REAL DEFAULT 0'),
    ('target_bonus', 'REAL DEFAULT 0'),
    ('second_paid', 'REAL DEFAULT 0'),
    ('total_paid', 'REAL DEFAULT 0'),
    ('labor_type', 'TEXT DEFAULT "Direct Labour"'),
    ('exchange_rate_khr', 'REAL DEFAULT 4044'),
    ('nssf_rate_khr', 'REAL DEFAULT 4049')
]:
    if col not in pay_cols:
        c.execute(f"ALTER TABLE payrolls ADD COLUMN {col} {c_type}")

# 1. Update company settings in system_meta
company_meta = {
    "name": "Hestra (Cambodia ) Co.,Ltd",
    "khmer_name": "ហេស្រ្តា(ខេមបូឌា)ឯ.ក",
    "vat_tin": "L001-902300053",
    "address": "National Road 4, Royal Group Phnom Penh Special Economic Zone Lot No. P2-81 Sangkat Pleung Chhes Rotes Khan Kambol Phnom Penh",
    "address_khmer": "ភ្លូវជាតិលេខ៤ តំបន់សេដ្ឋកិច្ចពិសេសរ៉ូយ៉ាល់គ្រុបភ្នំពេញ ឡូលេខៈP2-082 សង្កាត់ភ្លើងឆេះរទេះ ខណ្ឌកំបូល រាជធានីភ្នំពេញ",
    "business_activity": "Manufacturing of Leather and Fabric",
    "business_activity_khmer": "រោងចក្រផលិតសម្ភារៈកីឡាធ្វើពីស្បែកនិងក្រណាត់",
    "currency": "USD ($) & KHR (៛)",
    "workHours": "8.0",
    "timezone": "Asia/Phnom_Penh (GMT+7)",
    "fiscalYearStart": "January 1st",
    "hr_manager": "Mr. Te Sareat",
    "finance_manager": "Mr. Met Dara",
    "general_manager": "Mr. Hamamoto Tomoyuki",
    "nssf_exchange_rate": 4049,
    "gdt_exchange_rate": 4044
}
c.execute("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('company_settings', ?)", (json.dumps(company_meta),))
c.execute("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('company_name', ?)", ("Hestra (Cambodia ) Co.,Ltd",))

# 2. Insert standard factory departments
departments = [
    ('dept-prod', 'ផ្នែកដេរ & ផលិតកម្ម (Sewing & Production)', 'Sewing lines, pattern development, sample making and stitching operations', 350000, '#4f46e5'),
    ('dept-qc', 'ផ្នែកត្រួតពិនិត្យគុណភាព (Quality Control - QC)', 'In-line inspections, final QC audits, fabric & leather defect detection', 120000, '#06b6d4'),
    ('dept-cut', 'ផ្នែកកាត់ (Cutting Department)', 'Laser, die and mechanical leather and fabric pattern cutting operations', 150000, '#f59e0b'),
    ('dept-wh', 'ផ្នែកឃ្លាំង & វេចខ្ចប់ (Warehouse & Packaging)', 'Raw material inventory, finished sports glove packaging, carton palletizing', 130000, '#10b981'),
    ('dept-maint', 'ផ្នែកជួសជុល & ថែទាំ (Maintenance & Mechanics)', 'Sewing machine servicing, compressor upkeep, electrical maintenance', 90000, '#8b5cf6'),
    ('dept-turn', 'ផ្នែកត្រឡប់ & រៀបចំ (Turnover & Preparation)', 'Glove turnover, seam shaping, lining insertion and pre-assembly', 100000, '#ec4899'),
    ('dept-admin', 'ផ្នែករដ្ឋបាល & អនាម័យ (Admin, Logistics & Support)', 'Delivery logistics, factory hygiene, housekeeping and admin support', 80000, '#64748b')
]

for d_id, d_name, d_desc, d_budget, d_color in departments:
    c.execute("""
        INSERT INTO departments (id, name, description, budget, color)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET name=excluded.name, description=excluded.description
    """, (d_id, d_name, d_desc, d_budget, d_color))

def get_dept_id(pos):
    p = pos.lower()
    if 'sewing' in p or 'pattern' in p:
        return 'dept-prod'
    elif 'qc' in p:
        return 'dept-qc'
    elif 'cutting' in p:
        return 'dept-cut'
    elif 'warehouse' in p or 'setting' in p or 'packing' in p:
        return 'dept-wh'
    elif 'repair' in p or 'maint' in p:
        return 'dept-maint'
    elif 'turnover' in p:
        return 'dept-turn'
    elif 'delivery' in p or 'cleaner' in p:
        return 'dept-admin'
    return 'dept-prod'

now_iso = datetime.datetime.now().isoformat()
emp_count = 0
pay_count = 0

for l in emp_lines:
    parts = [p.strip() for p in l.split('\t')]
    emp_id = parts[0]
    khmer_name = parts[1]
    english_name = parts[2]
    join_date = convert_date(parts[3])
    working_period = int(clean_num(parts[4]))
    contract_raw = parts[5].strip()
    contract_type = 'UDC (មិនកំណត់ថិរវេលា)' if 'UDC' in contract_raw.upper() else 'FDC (កំណត់ថិរវេលា)'
    bank_name = parts[6].strip() or 'ABA Bank'
    bank_account_name = parts[7].strip() or english_name
    bank_account_num = parts[8].strip()
    dob = convert_date(parts[9])
    national_id = parts[10].strip()
    gender_raw = parts[11].strip().upper()
    gender = 'ស្រី (Female)' if gender_raw == 'F' else 'ប្រុស (Male)'
    nationality = 'កម្ពុជា (Cambodian)'
    position = parts[13].strip()
    basic_salary = clean_num(parts[14])
    working_days = clean_num(parts[15])
    absent_days = clean_num(parts[16])
    unpaid_days = clean_num(parts[17])
    basic_working_salary = clean_num(parts[18])
    seniority_bonus = clean_num(parts[19])
    position_allowance = clean_num(parts[20])
    sewing_skill_matrix = clean_num(parts[21])
    skill_allowance = clean_num(parts[22])
    transport_housing = clean_num(parts[23])
    attendance_allowance = clean_num(parts[24])
    food_allowance = clean_num(parts[25])
    overtime_pay = clean_num(parts[26])
    overtime_food = clean_num(parts[27])
    achievement_bonus = clean_num(parts[28])
    monthly_eval_bonus = clean_num(parts[29])
    annual_leave = clean_num(parts[30])
    tax_on_seniority = clean_num(parts[31])
    salary_adjustment = clean_num(parts[32])
    total_salary = clean_num(parts[33])
    non_taxable_total = clean_num(parts[34])
    pension_fund = clean_num(parts[35])
    taxable_salary_usd = clean_num(parts[36])
    taxable_salary_khr = clean_num(parts[37])
    spouse = int(clean_num(parts[38]))
    minor_children = int(clean_num(parts[39]))
    deduct_amount = clean_num(parts[40])
    taxable_base = clean_num(parts[41])
    tax_rate = parts[42].strip() or '0%'
    tax_on_salary_khr = clean_num(parts[43])
    tax_on_salary_usd = clean_num(parts[44])
    after_tax_salary = clean_num(parts[45])
    cash_adj = clean_num(parts[46])
    first_paid = clean_num(parts[47])
    paid_target_bonus = clean_num(parts[48])
    paid_food_fee = clean_num(parts[49])
    severance_pay = clean_num(parts[50])
    seniority_payback = clean_num(parts[51])
    paid_final_salary = clean_num(parts[52])
    
    # Audit & heal second paid & total paid
    second_paid = round(after_tax_salary - first_paid - paid_target_bonus, 2)
    total_paid = round(first_paid + paid_target_bonus + second_paid, 2)
    labor_type = parts[56].strip() if len(parts) > 56 and parts[56].strip() else 'Direct Labour'

    # Name breakdown (Family name + Given name)
    name_parts = english_name.split()
    if len(name_parts) >= 2:
        last_name = name_parts[0]
        first_name = " ".join(name_parts[1:])
    else:
        last_name = english_name
        first_name = english_name

    dept_id = get_dept_id(position)
    email = f"{emp_id.lower()}@outlook.com"

    # Insert or update employee
    c.execute("""
        INSERT INTO employees (
            id, first_name, last_name, khmer_name, email, phone, role, department_id,
            employment_type, employee_type, status, salary, join_date, avatar, location,
            gender, dob, nationality, national_id, contract_type,
            bank_name, bank_account_name, bank_account_number,
            nssf_member, nssf_number, transport_allowance, attendance_allowance,
            meal_allowance, skill_allowance, seniority_bonus, position_allowance,
            sewing_skill_matrix, labor_type, working_period, created_at
        ) VALUES (
            ?, ?, ?, ?, ?, '', ?, ?,
            'ពេញម៉ោង (Full-Time)', 'បុគ្គលិកពេញសិទ្ធិ (Regular / Permanent)', 'Active', ?, ?, '', 'រាជធានីភ្នំពេញ (Phnom Penh)',
            ?, ?, ?, ?, ?,
            ?, ?, ?,
            'មាន (Yes)', ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?
        )
        ON CONFLICT(id) DO UPDATE SET
            first_name = excluded.first_name,
            last_name = excluded.last_name,
            khmer_name = excluded.khmer_name,
            role = excluded.role,
            department_id = excluded.department_id,
            salary = excluded.salary,
            join_date = excluded.join_date,
            gender = excluded.gender,
            dob = excluded.dob,
            national_id = excluded.national_id,
            contract_type = excluded.contract_type,
            bank_name = excluded.bank_name,
            bank_account_name = excluded.bank_account_name,
            bank_account_number = excluded.bank_account_number,
            transport_allowance = excluded.transport_allowance,
            attendance_allowance = excluded.attendance_allowance,
            meal_allowance = excluded.meal_allowance,
            skill_allowance = excluded.skill_allowance,
            seniority_bonus = excluded.seniority_bonus,
            position_allowance = excluded.position_allowance,
            sewing_skill_matrix = excluded.sewing_skill_matrix,
            labor_type = excluded.labor_type,
            working_period = excluded.working_period
    """, (
        emp_id, first_name, last_name, khmer_name, email, position, dept_id,
        basic_salary, join_date,
        gender, dob, nationality, national_id, contract_type,
        bank_name, bank_account_name, bank_account_num,
        national_id, transport_housing, attendance_allowance,
        food_allowance, skill_allowance, seniority_bonus, position_allowance,
        sewing_skill_matrix, labor_type, working_period, now_iso
    ))
    emp_count += 1

    # Leave balance initialization
    c.execute("""
        INSERT OR IGNORE INTO leave_balances (id, employee_id, annual_total, annual_used, sick_total, sick_used, casual_total, casual_used)
        VALUES (?, ?, 18, 0, 7, 0, 5, 0)
    """, (f"bal-{emp_id}", emp_id))

    # User account creation for self-service
    c.execute("""
        INSERT OR IGNORE INTO users (
            id, username, name, email, role, status, employee_id, department_name, avatar,
            two_factor_enabled, permissions, password, last_login, created_at
        ) VALUES (
            ?, ?, ?, ?, 'Employee', 'Active', ?, ?, '', 0,
            'self_service,clock_in,request_leave,view_payslips', '@9218njo0(TWp<3q"(3{', 'Imported', ?
        )
    """, (
        f"usr-{emp_id.lower()}",
        emp_id.lower(),
        f"{khmer_name} ({english_name})",
        email,
        emp_id,
        dept_id,
        now_iso.split('T')[0]
    ))

    # 3. Insert August 2026 Payroll Record
    payroll_id = f"pay-august-2026-{emp_id.lower()}"
    allowances = round(transport_housing + attendance_allowance + food_allowance + position_allowance + sewing_skill_matrix + skill_allowance, 2)
    bonuses = round(seniority_bonus + overtime_pay + overtime_food + achievement_bonus + monthly_eval_bonus + annual_leave + salary_adjustment, 2)

    c.execute("""
        INSERT INTO payrolls (
            id, employee_id, pay_period, payment_date, base_salary,
            allowances, bonuses, tax_deduction, insurance_deduction, other_deductions,
            net_salary, status, payment_method, created_at,
            working_days, absent_days, unpaid_days, basic_working_salary,
            seniority_bonus, position_allowance, sewing_skill_matrix, skill_allowance,
            transport_housing, attendance_allowance, food_allowance,
            overtime_pay, overtime_food, achievement_bonus, monthly_eval_bonus,
            annual_leave, salary_adjustment, gross_salary, non_taxable_amount,
            taxable_salary_usd, taxable_salary_khr, pension_usd, pension_khr,
            dependents_count, taxable_base_khr, tax_rate, tax_khr, tax_usd,
            after_tax_salary, first_paid, target_bonus, second_paid, total_paid,
            labor_type, exchange_rate_khr, nssf_rate_khr
        ) VALUES (
            ?, ?, 'August 2026', '2026-08-31', ?,
            ?, ?, ?, ?, 0,
            ?, 'Paid', 'ABA Direct Transfer', ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, 4044, 4049
        )
        ON CONFLICT(id) DO UPDATE SET
            base_salary = excluded.base_salary,
            allowances = excluded.allowances,
            bonuses = excluded.bonuses,
            tax_deduction = excluded.tax_deduction,
            insurance_deduction = excluded.insurance_deduction,
            net_salary = excluded.net_salary,
            working_days = excluded.working_days,
            absent_days = excluded.absent_days,
            unpaid_days = excluded.unpaid_days,
            basic_working_salary = excluded.basic_working_salary,
            seniority_bonus = excluded.seniority_bonus,
            position_allowance = excluded.position_allowance,
            sewing_skill_matrix = excluded.sewing_skill_matrix,
            skill_allowance = excluded.skill_allowance,
            transport_housing = excluded.transport_housing,
            attendance_allowance = excluded.attendance_allowance,
            food_allowance = excluded.food_allowance,
            overtime_pay = excluded.overtime_pay,
            overtime_food = excluded.overtime_food,
            achievement_bonus = excluded.achievement_bonus,
            monthly_eval_bonus = excluded.monthly_eval_bonus,
            annual_leave = excluded.annual_leave,
            salary_adjustment = excluded.salary_adjustment,
            gross_salary = excluded.gross_salary,
            non_taxable_amount = excluded.non_taxable_amount,
            taxable_salary_usd = excluded.taxable_salary_usd,
            taxable_salary_khr = excluded.taxable_salary_khr,
            pension_usd = excluded.pension_usd,
            pension_khr = excluded.pension_khr,
            dependents_count = excluded.dependents_count,
            taxable_base_khr = excluded.taxable_base_khr,
            tax_rate = excluded.tax_rate,
            tax_khr = excluded.tax_khr,
            tax_usd = excluded.tax_usd,
            after_tax_salary = excluded.after_tax_salary,
            first_paid = excluded.first_paid,
            target_bonus = excluded.target_bonus,
            second_paid = excluded.second_paid,
            total_paid = excluded.total_paid,
            labor_type = excluded.labor_type
    """, (
        payroll_id, emp_id, basic_salary,
        allowances, bonuses, tax_on_salary_usd, pension_fund,
        total_paid, now_iso,
        working_days, absent_days, unpaid_days, basic_working_salary,
        seniority_bonus, position_allowance, sewing_skill_matrix, skill_allowance,
        transport_housing, attendance_allowance, food_allowance,
        overtime_pay, overtime_food, achievement_bonus, monthly_eval_bonus,
        annual_leave, salary_adjustment, total_salary, non_taxable_total,
        taxable_salary_usd, taxable_salary_khr, pension_fund, round(pension_fund * 4049, 2),
        spouse + minor_children, taxable_base, tax_rate, tax_on_salary_khr, tax_on_salary_usd,
        after_tax_salary, first_paid, paid_target_bonus, second_paid, total_paid,
        labor_type
    ))
    pay_count += 1

conn.commit()
conn.close()

print(f"Successfully imported {emp_count} employees and {pay_count} August 2026 payroll records into data/hr.db!")
