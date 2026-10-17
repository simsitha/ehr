import sqlite3
from datetime import datetime

conn = sqlite3.connect('data/hr.db')
c = conn.cursor()

print("--- Seeding August 2026 Attendance Records ---")

# 1. Fetch all August 2026 payroll records
pay_rows = c.execute('''
    SELECT p.employee_id, p.working_days, p.absent_days, p.unpaid_days, p.annual_leave,
           p.attendance_allowance, p.overtime_pay, e.join_date, e.salary, e.first_name || ' ' || e.last_name
    FROM payrolls p
    JOIN employees e ON e.id = p.employee_id
    WHERE p.pay_period = 'August 2026'
    ORDER BY p.employee_id
''').fetchall()

print(f"Loaded {len(pay_rows)} employees from August 2026 payroll.")

# 2. Map of non-standard assignments for all 40 employees with absences, leaves, or mid-month joins
non_standard_assignments = {
    'HC369': {'OL': [1]},
    'HC370': {'OL': [1, 3]},
    'HC371': {'OL': [1, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20]},
    'HC372': {'OL': [1, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20], 'AB': [21]},
    'HC346': {
        'OL': [1, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 17, 18, 19],
        'AB': [20, 21, 22],
        'AL': [24, 25, 26],
        'AL_HALF_AND_WORKED': [27],
        'WORKED_DAYS': [28, 29],
        'OFF_EXTRA': [31]
    },
    'HC357': {'AB': [10, 11, 12, 13, 14, 15, 17], 'AL': [24, 25, 26]},
    'HC214': {'AB': [17, 18, 19, 20, 21, 22, 24], 'HALF': [25]},
    'HC003': {'AB': [14], 'HALF': [21]},
    'HC320': {'AB': [12], 'HALF': [19]},
    'HC326': {'AB': [11], 'HALF': [18]},
    'HC016': {'AB': [17, 18, 19, 20], 'AL_HALF_AND_WORKED': [21]},
    'HC290': {'AB': [13, 14], 'AL': [20, 21]},
    'HC301': {'AL': [17, 18], 'AL_HALF_AND_WORKED': [19]},
    'HC005': {'AB': [13, 14]},
    'HC010': {'AB': [10, 11, 12, 13]},
    'HC032': {'AB': [17, 18, 19, 20, 21]},
    'HC130': {'AB': [18, 19, 20]},
    'HC185': {'AB': [14, 15]},
    'HC293': {'AB': [12, 13, 14]},
    'HC329': {'AB': [18, 19]},
    'HC333': {'AB': [25, 26]},
    'HC344': {'AB': [10, 11, 12, 13, 14]},
    'HC364': {'AB': [19, 20, 21]},
    'HC021': {'AB': [14]},
    'HC030': {'AB': [15]},
    'HC033': {'AB': [18]},
    'HC073': {'AB': [12]},
    'HC157': {'AB': [11]},
    'HC158': {'AB': [19]},
    'HC180': {'AB': [21]},
    'HC184': {'AB': [13]},
    'HC190': {'AB': [14]},
    'HC196': {'AB': [20]},
    'HC227': {'AB': [25]},
    'HC241': {'AB': [26]},
    'HC283': {'AB': [18]},
    'HC287': {'AB': [19]},
    'HC303': {'AB': [21]},
    'HC324': {'AB': [22]},
    'HC341': {'AB': [27]},
}

sundays = {2, 9, 16, 23, 30}

# Overtime assignments (in hours) on weekdays
overtime_map = {
    'HC005': {3: 2, 5: 2, 7: 2, 10: 2, 12: 2, 17: 2, 19: 2, 24: 2, 26: 2, 28: 2, 31: 1}, # 21 hrs
    'HC142': {3: 2, 5: 2, 7: 2, 10: 2, 12: 2, 14: 2, 17: 2, 19: 2, 21: 2, 24: 2, 26: 1}, # 21 hrs
    'HC180': {d: 2 for d in range(1, 32) if d not in sundays},                              # 52 hrs (26 days * 2 hrs)
    'HC292': {3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 10: 2, 11: 2, 12: 2, 13: 2, 14: 2, 17: 1},   # 21 hrs
}

records_to_insert = []

for row in pay_rows:
    emp_id = row[0]
    exp_wd, exp_ab, exp_unp, exp_al, exp_att, exp_ot = row[1], row[2], row[3], row[4], row[5], row[6]
    cfg = non_standard_assignments.get(emp_id, {})
    
    ol_days = set(cfg.get('OL', []))
    ab_days = set(cfg.get('AB', []))
    al_days = set(cfg.get('AL', []))
    half_days = set(cfg.get('HALF', []))
    al_half_worked = set(cfg.get('AL_HALF_AND_WORKED', []))
    off_extra = set(cfg.get('OFF_EXTRA', []))
    
    emp_ot_map = overtime_map.get(emp_id, {})
    
    for d in range(1, 32):
        date_str = f"2026-08-{d:02d}"
        att_id = f"att-{emp_id}-{date_str}"
        ot_hours = emp_ot_map.get(d, 0.0)
        
        if d in sundays:
            records_to_insert.append((
                att_id, emp_id, date_str, None, None, 'Rest Day', 0.0, 'Sunday Weekly Rest', 'OFF', 0.0, 0.0, 'calendar'
            ))
        elif d in off_extra:
            records_to_insert.append((
                att_id, emp_id, date_str, None, None, 'Rest Day', 0.0, 'Scheduled Rest Day', 'OFF', 0.0, 0.0, 'calendar'
            ))
        elif d in ol_days:
            records_to_insert.append((
                att_id, emp_id, date_str, None, None, 'Unpaid Leave', 0.0, 'Unpaid Leave / Before Employment', 'OL', 0.0, 0.0, 'calendar'
            ))
        elif d in ab_days:
            records_to_insert.append((
                att_id, emp_id, date_str, None, None, 'Absent', 0.0, 'Unexcused Absence', 'AB', 0.0, 0.0, 'manual'
            ))
        elif d in al_days:
            records_to_insert.append((
                att_id, emp_id, date_str, None, None, 'On Leave', 8.0, 'Approved Annual Leave', 'AL', 8.0, 0.0, 'leaves'
            ))
        elif d in al_half_worked:
            # 0.5 AL + 0.5 Worked
            records_to_insert.append((
                att_id, emp_id, date_str, '07:30:00', '11:30:00', 'On Leave', 4.0, 'Half-day Annual Leave (0.5 AL + 0.5 Present)', 'AL', 4.0, ot_hours, 'leaves'
            ))
        elif d in half_days:
            # 0.5 Worked + 0.5 Absent
            records_to_insert.append((
                att_id, emp_id, date_str, '07:30:00', '11:30:00', 'Half Day', 4.0, 'Morning shift only (4 hrs)', '0.5', 4.0, ot_hours, 'manual'
            ))
        else:
            # Standard full day present
            records_to_insert.append((
                att_id, emp_id, date_str, '07:30:00', '16:30:00', 'Present', 8.0, None, '1', 8.0, ot_hours, 'biometric'
            ))

print(f"Total August attendance records generated: {len(records_to_insert)}")

# 3. Clean up any existing August records and insert new records
c.execute("DELETE FROM attendance WHERE date >= '2026-08-01' AND date <= '2026-08-31'")
c.executemany('''
    INSERT OR REPLACE INTO attendance (
        id, employee_id, date, clock_in, clock_out, status, work_hours, notes, code, hours, overtime_hours, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
''', records_to_insert)

conn.commit()
print("Successfully inserted all August 2026 attendance records into data/hr.db!")
