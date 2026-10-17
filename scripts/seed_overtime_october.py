import sqlite3
import random
from datetime import datetime

conn = sqlite3.connect('data/hr.db')
cursor = conn.cursor()

# Check existing overtime_requests
cursor.execute('SELECT COUNT(*) FROM overtime_requests')
cnt = cursor.fetchone()[0]

if cnt == 0:
    cursor.execute('''
        SELECT id, first_name, last_name, group_name, salary 
        FROM employees 
        WHERE id LIKE 'HC%'
        ORDER BY id ASC
        LIMIT 25
    ''')
    emps = cursor.fetchall()
    
    dates = [
        '2026-10-02', '2026-10-03', '2026-10-05', '2026-10-06', '2026-10-07',
        '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-12', '2026-10-14'
    ]
    
    shifts = [
        ('18:00', '20:00', 2.0, 'normal_day_150', 1.5, 'Urgent winter jacket order assembly'),
        ('17:30', '19:30', 2.0, 'normal_day_150', 1.5, 'End of day bulk fabric cutting target'),
        ('08:00', '12:00', 4.0, 'weekend_200', 2.0, 'Saturday extra production line catch-up'),
        ('20:00', '00:00', 4.0, 'night_200', 2.0, 'Urgent overnight quality inspection & packing'),
        ('18:00', '21:00', 3.0, 'normal_day_150', 1.5, 'Export shipment deadline preparation'),
    ]

    statuses = ['Approved', 'Approved', 'Approved', 'Pending Admin', 'Pending Manager', 'Submitted']

    created_count = 0
    approved_count = 0

    for idx, emp in enumerate(emps):
        emp_id, f_name, l_name, group_name, salary = emp
        salary = salary or 220.0
        hourly_rate = round(salary / 26 / 8, 4)

        # 1 to 2 overtime requests per sample employee
        num_reqs = 1 if idx % 2 == 0 else 2
        for r in range(num_reqs):
            dt = dates[(idx * 2 + r) % len(dates)]
            s_time, e_time, hrs, rate_type, mult, reason = shifts[(idx + r) % len(shifts)]
            status = statuses[(idx + r) % len(statuses)]
            est_pay = round(hourly_rate * mult * hrs, 2)
            ot_id = f"ot-202610-{emp_id}-{r+1}"
            now = datetime.now().isoformat()

            mgr_id = 'mgr-1' if status in ('Approved', 'Pending Admin') else None
            mgr_time = now if status in ('Approved', 'Pending Admin') else None
            mgr_comm = 'Line Supervisor verified & approved' if status in ('Approved', 'Pending Admin') else None

            adm_id = 'usr-admin' if status == 'Approved' else None
            adm_time = now if status == 'Approved' else None
            adm_comm = 'HR Manager final approved for payroll' if status == 'Approved' else None

            cursor.execute('''
                INSERT INTO overtime_requests (
                    id, employee_id, date, start_time, end_time, hours, ot_rate_type, multiplier,
                    hourly_rate, estimated_pay, reason, project_name, status,
                    line_manager_id, line_manager_reviewed_at, line_manager_comments,
                    admin_reviewer_id, admin_reviewed_at, admin_comments, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                ot_id, emp_id, dt, s_time, e_time, hrs, rate_type, mult,
                hourly_rate, est_pay, reason, f"Factory Line {group_name or 'Production'}", status,
                mgr_id, mgr_time, mgr_comm, adm_id, adm_time, adm_comm, now
            ))
            created_count += 1

            if status == 'Approved':
                approved_count += 1
                # Sync into attendance table
                att_id = f"att-{emp_id}-{dt}"
                cursor.execute('''
                    INSERT INTO attendance (id, employee_id, date, status, work_hours, overtime_hours, source)
                    VALUES (?, ?, ?, 'Present', 8.0, ?, 'overtime_approved')
                    ON CONFLICT(employee_id, date) DO UPDATE SET
                        overtime_hours = COALESCE(attendance.overtime_hours, 0) + excluded.overtime_hours
                ''', (att_id, emp_id, dt, hrs))

    conn.commit()
    print(f"Seeded {created_count} overtime requests ({approved_count} approved with attendance sync).")
else:
    print(f"Overtime requests already exist ({cnt} rows).")

conn.close()
