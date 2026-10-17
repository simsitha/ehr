import { NextResponse } from 'next/server';
import { getDb, getEmployeeGroups, saveEmployeeGroup } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    const departments = db.prepare(`
      SELECT 
        d.*,
        m.first_name || ' ' || m.last_name as manager_name,
        count(e.id) as employee_count
      FROM departments d
      LEFT JOIN employees m ON m.id = d.manager_id
      LEFT JOIN employees e ON e.department_id = d.id AND e.status != 'Terminated'
      GROUP BY d.id, m.first_name, m.last_name
      ORDER BY d.name ASC
    `).all() as any[];

    const allGroups = getEmployeeGroups();
    const groupsByDept = new Map<string, any[]>();
    for (const g of allGroups) {
      if (g.department_id) {
        if (!groupsByDept.has(g.department_id)) {
          groupsByDept.set(g.department_id, []);
        }
        groupsByDept.get(g.department_id)!.push(g);
      }
    }

    const enhanced = departments.map((d) => {
      const dGroups = groupsByDept.get(d.id) || [];
      return {
        ...d,
        groups: dGroups,
        group_count: dGroups.length,
      };
    });

    return NextResponse.json(enhanced);
  } catch (error: any) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { name, description = '', manager_id = null, color = '#3b82f6', groups = [] } = body;

    if (!name) {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
    }

    const id = `dept-${Date.now()}`;
    db.prepare(`
      INSERT INTO departments (id, name, description, manager_id, color)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, name, description, manager_id, color);

    // Create initial groups if provided
    if (Array.isArray(groups) && groups.length > 0) {
      for (const g of groups) {
        const grpName = typeof g === 'string' ? g.trim() : (g?.name ? String(g.name).trim() : '');
        const grpDesc = typeof g === 'object' && g?.description ? String(g.description).trim() : '';
        if (grpName) {
          saveEmployeeGroup({
            name: grpName,
            department_id: id,
            description: grpDesc,
          });
        }
      }
    }

    const created = db.prepare(`
      SELECT 
        d.*,
        m.first_name || ' ' || m.last_name as manager_name,
        0 as employee_count
      FROM departments d
      LEFT JOIN employees m ON m.id = d.manager_id
      WHERE d.id = ?
    `).get(id) as any;

    const deptGroups = getEmployeeGroups(id);
    return NextResponse.json({
      ...created,
      groups: deptGroups,
      group_count: deptGroups.length,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating department:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

