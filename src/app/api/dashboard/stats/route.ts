import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { DashboardStats } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 1. Employee headcount stats
    const totalRow = db.prepare('SELECT count(*) as count FROM employees').get() as { count: number };
    const activeRow = db.prepare("SELECT count(*) as count FROM employees WHERE status = 'Active'").get() as { count: number };
    const leaveRow = db.prepare("SELECT count(*) as count FROM employees WHERE status = 'On Leave'").get() as { count: number };

    // New hires in last 60 days
    const newHiresRow = db.prepare("SELECT count(*) as count FROM employees WHERE join_date >= ?").get(sixtyDaysAgo) as { count: number };

    // 2. Attendance today
    const attendanceRecords = db.prepare(`
      SELECT status, count(*) as count 
      FROM attendance 
      WHERE date = ? 
      GROUP BY status
    `).all(today) as { status: string; count: number }[];

    let present = 0;
    let remote = 0;
    let absent = 0;
    let late = 0;

    attendanceRecords.forEach((r) => {
      if (r.status === 'Present') present = r.count;
      else if (r.status === 'Remote') remote = r.count;
      else if (r.status === 'Absent') absent = r.count;
      else if (r.status === 'Late') late = r.count;
    });

    const totalTracked = present + remote + absent + late;
    const attendancePercentage = totalTracked > 0 ? Math.round(((present + remote + late) / totalTracked) * 100) : 95;

    // 3. Pending leaves
    const pendingLeaves = db.prepare("SELECT count(*) as count FROM leave_requests WHERE status IN ('Pending', 'Pending Manager', 'Pending Admin')").get() as { count: number };

    // 4. Open positions
    const openJobs = db.prepare("SELECT count(*) as count FROM job_postings WHERE status = 'Active'").get() as { count: number };

    // 5. Monthly payroll total (latest pay period or active base salary budget)
    let monthlyPayroll = 0;
    const latestPayroll = db.prepare(`
      SELECT sum(net_salary) as total 
      FROM payrolls 
      WHERE pay_period = (SELECT pay_period FROM payrolls ORDER BY payment_date DESC LIMIT 1)
    `).get() as { total: number | null } | undefined;

    if (latestPayroll && latestPayroll.total) {
      monthlyPayroll = latestPayroll.total;
    } else {
      const activeSalarySum = db.prepare("SELECT sum(salary) as total FROM employees WHERE status != 'Terminated'").get() as { total: number | null } | undefined;
      monthlyPayroll = activeSalarySum?.total || 0;
    }

    // 6. Department distribution
    const deptDistribution = db.prepare(`
      SELECT d.name, d.color, count(e.id) as count
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id
      GROUP BY d.id
      ORDER BY count DESC
    `).all() as { name: string; color: string; count: number }[];

    // 7. Recent activities
    const recentLeaves = db.prepare(`
      SELECT lr.id, lr.leave_type, lr.status, lr.created_at, 
        COALESCE(e.first_name, u.name, 'Employee') as first_name, 
        COALESCE(e.last_name, '') as last_name
      FROM leave_requests lr
      LEFT JOIN employees e ON e.id = lr.employee_id
      LEFT JOIN users u ON (u.id = lr.employee_id OR u.employee_id = lr.employee_id)
      ORDER BY lr.created_at DESC
      LIMIT 3
    `).all() as any[];

    const recentEmployees = db.prepare(`
      SELECT id, first_name, last_name, role, join_date
      FROM employees
      ORDER BY join_date DESC
      LIMIT 2
    `).all() as any[];

    const activities: DashboardStats['recentActivities'] = [];

    recentLeaves.forEach((l) => {
      activities.push({
        id: `act-leave-${l.id}`,
        type: 'leave',
        title: `${l.first_name} ${l.last_name} requested ${l.leave_type} Leave`,
        subtitle: `Status: ${l.status}`,
        timestamp: l.created_at,
        statusBadge: l.status,
      });
    });

    recentEmployees.forEach((emp) => {
      activities.push({
        id: `act-hire-${emp.id}`,
        type: 'hire',
        title: `Welcome ${emp.first_name} ${emp.last_name}`,
        subtitle: `Joined as ${emp.role}`,
        timestamp: emp.join_date,
        statusBadge: 'New Hire',
      });
    });

    // 8. Upcoming Anniversaries & Celebrations (computed from real staff records)
    const celebrations: DashboardStats['upcomingBirthdaysAndAnniversaries'] = [];
    try {
      const staffWithDates = db.prepare(`
        SELECT id, first_name, last_name, avatar, dob, join_date 
        FROM employees 
        WHERE status != 'Terminated'
      `).all() as any[];

      const currentMonthNum = new Date().getMonth() + 1;

      staffWithDates.forEach((emp) => {
        if (emp.dob) {
          const parts = emp.dob.split('-').map(Number);
          if (parts.length >= 3 && parts[1] === currentMonthNum) {
            celebrations.push({
              id: `bday-${emp.id}`,
              name: `${emp.first_name} ${emp.last_name}`,
              avatar: emp.avatar || '',
              type: 'birthday',
              date: `Day ${parts[2]}`,
              subtitle: 'Birthday celebration this month 🎂',
            });
          }
        }
        if (emp.join_date) {
          const parts = emp.join_date.split('-').map(Number);
          if (parts.length >= 3) {
            const years = new Date().getFullYear() - parts[0];
            if (parts[1] === currentMonthNum && years > 0) {
              celebrations.push({
                id: `anniv-${emp.id}`,
                name: `${emp.first_name} ${emp.last_name}`,
                avatar: emp.avatar || '',
                type: 'anniversary',
                date: `${years} Year${years > 1 ? 's' : ''}`,
                subtitle: `Work Anniversary on Day ${parts[2]} 🎖️`,
              });
            }
          }
        }
      });
    } catch (e) {}

    const stats: DashboardStats = {
      totalEmployees: totalRow.count,
      activeEmployees: activeRow.count,
      onLeaveEmployees: leaveRow.count,
      newHiresThisMonth: newHiresRow.count,
      attendanceToday: {
        present: present,
        remote: remote,
        absent: absent,
        late: late,
        percentage: totalTracked > 0 ? Math.round(((present + remote + late) / totalTracked) * 100) : 0,
      },
      pendingLeavesCount: pendingLeaves.count,
      openPositionsCount: openJobs.count,
      monthlyPayrollTotal: monthlyPayroll,
      departmentDistribution: deptDistribution,
      recentActivities: activities,
      upcomingBirthdaysAndAnniversaries: totalRow.count > 0 ? celebrations : [],
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
