import json
import re

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

with open('/root/.gemini/antigravity-cli/brain/99094a46-4af3-4fce-a2d5-6eb7812c3eb3/.system_generated/logs/transcript_full.jsonl') as f:
    data = json.loads(f.readline())

content = data.get('content', '')
lines = content.split('\n')

emp_lines = [l for l in lines if l.strip().startswith('HC')]
print(f"Total employee lines found: {len(emp_lines)}")

employees = []
for idx, l in enumerate(emp_lines):
    parts = [p.strip() for p in l.split('\t')]
    emp_id = parts[0]
    khmer_name = parts[1]
    english_name = parts[2]
    join_date = parts[3]
    working_period = clean_num(parts[4])
    contract_type = parts[5]
    bank_name = parts[6]
    bank_account_name = parts[7]
    bank_account_num = parts[8]
    dob = parts[9]
    national_id = parts[10]
    gender = parts[11]
    nationality = parts[12]
    position = parts[13]
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
    spouse = clean_num(parts[38])
    minor_children = clean_num(parts[39])
    deduct_amount = clean_num(parts[40])
    taxable_base = clean_num(parts[41])
    tax_rate = parts[42]
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
    second_paid_raw = parts[53] if len(parts) > 53 else ''
    total_paid_raw = parts[54] if len(parts) > 54 else ''
    
    # Calculate true second paid & total paid
    # After tax salary is the net payable for the month
    # First paid was advanced mid-month
    # Target bonus is paid weekly/daily
    # So Second Paid = After Tax Salary - First Paid - Paid Target Bonus
    second_paid = round(after_tax_salary - first_paid - paid_target_bonus, 2)
    total_paid = round(first_paid + paid_target_bonus + second_paid, 2)
    
    employees.append({
        'id': emp_id,
        'khmer_name': khmer_name,
        'english_name': english_name,
        'join_date': join_date,
        'working_period': working_period,
        'contract_type': contract_type,
        'bank_name': bank_name,
        'bank_account_name': bank_account_name,
        'bank_account_num': bank_account_num,
        'dob': dob,
        'national_id': national_id,
        'gender': gender,
        'nationality': nationality,
        'position': position,
        'basic_salary': basic_salary,
        'working_days': working_days,
        'absent_days': absent_days,
        'unpaid_days': unpaid_days,
        'basic_working_salary': basic_working_salary,
        'seniority_bonus': seniority_bonus,
        'position_allowance': position_allowance,
        'sewing_skill_matrix': sewing_skill_matrix,
        'skill_allowance': skill_allowance,
        'transport_housing': transport_housing,
        'attendance_allowance': attendance_allowance,
        'food_allowance': food_allowance,
        'overtime_pay': overtime_pay,
        'overtime_food': overtime_food,
        'achievement_bonus': achievement_bonus,
        'monthly_eval_bonus': monthly_eval_bonus,
        'annual_leave': annual_leave,
        'tax_on_seniority': tax_on_seniority,
        'salary_adjustment': salary_adjustment,
        'total_salary': total_salary,
        'non_taxable_total': non_taxable_total,
        'pension_fund': pension_fund,
        'taxable_salary_usd': taxable_salary_usd,
        'taxable_salary_khr': taxable_salary_khr,
        'spouse': spouse,
        'minor_children': minor_children,
        'deduct_amount': deduct_amount,
        'taxable_base': taxable_base,
        'tax_rate': tax_rate,
        'tax_on_salary_khr': tax_on_salary_khr,
        'tax_on_salary_usd': tax_on_salary_usd,
        'after_tax_salary': after_tax_salary,
        'cash_adj': cash_adj,
        'first_paid': first_paid,
        'paid_target_bonus': paid_target_bonus,
        'paid_food_fee': paid_food_fee,
        'severance_pay': severance_pay,
        'seniority_payback': seniority_payback,
        'paid_final_salary': paid_final_salary,
        'second_paid_raw': second_paid_raw,
        'second_paid': second_paid,
        'total_paid_raw': total_paid_raw,
        'total_paid': total_paid,
        'labor_type': parts[56] if len(parts) > 56 else 'Direct Labour'
    })

print(f"Parsed {len(employees)} employees.")
print(f"Sample employee: {employees[0]['id']} {employees[0]['english_name']} Basic: ${employees[0]['basic_salary']} Gross: ${employees[0]['total_salary']} Net: ${employees[0]['after_tax_salary']} 1st: ${employees[0]['first_paid']} 2nd: ${employees[0]['second_paid']}")

# Sums
sum_basic = sum(e['basic_salary'] for e in employees)
sum_gross = sum(e['total_salary'] for e in employees)
sum_pension = sum(e['pension_fund'] for e in employees)
sum_tax_khr = sum(e['tax_on_salary_khr'] for e in employees)
sum_tax_usd = sum(e['tax_on_salary_usd'] for e in employees)
sum_after_tax = sum(e['after_tax_salary'] for e in employees)
sum_first_paid = sum(e['first_paid'] for e in employees)
sum_target_bonus = sum(e['paid_target_bonus'] for e in employees)
sum_second_paid = sum(e['second_paid'] for e in employees)
sum_total_paid = sum(e['total_paid'] for e in employees)

print("\n--- AUDITED TOTALS ---")
print(f"Sum Basic Salary:    ${sum_basic:,.2f}")
print(f"Sum Gross Salary:    ${sum_gross:,.2f}")
print(f"Sum Pension (USD):   ${sum_pension:,.2f}")
print(f"Sum Tax (KHR):       {sum_tax_khr:,.2f} KHR")
print(f"Sum Tax (USD):       ${sum_tax_usd:,.2f}")
print(f"Sum After Tax:       ${sum_after_tax:,.2f}")
print(f"Sum First Paid:      ${sum_first_paid:,.2f}")
print(f"Sum Target Bonus:    ${sum_target_bonus:,.2f}")
print(f"Sum Second Paid:     ${sum_second_paid:,.2f}")
print(f"Sum Total Paid:      ${sum_total_paid:,.2f}")
