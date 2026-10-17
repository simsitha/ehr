import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { PerformanceReview, isBoardMember } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employee_id');

    let sql = `
      SELECT 
        pr.*,
        e.first_name || ' ' || e.last_name as employee_name,
        e.avatar as employee_avatar,
        e.role as employee_role,
        r.first_name || ' ' || r.last_name as reviewer_name
      FROM performance_reviews pr
      JOIN employees e ON e.id = pr.employee_id
      LEFT JOIN employees r ON r.id = pr.reviewer_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (employeeId) {
      sql += ` AND pr.employee_id = ?`;
      params.push(employeeId);
    }

    sql += ` ORDER BY pr.created_at DESC`;

    const reviews = db.prepare(sql).all(...params) as PerformanceReview[];
    return NextResponse.json(reviews);
  } catch (error: any) {
    console.error('Error fetching performance reviews:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const {
      employee_id,
      reviewer_id = 'usr-admin',
      review_period = 'Q3 2026',
      rating = 4.5,
      goals_achievement = 95,
      strengths = '',
      areas_for_growth = '',
      status = 'Completed',
    } = body;

    if (!employee_id) {
      return NextResponse.json({ error: 'employee_id is required' }, { status: 400 });
    }

    const emp = db.prepare('SELECT id, role, department_id, employee_type, employment_type FROM employees WHERE id = ?').get(employee_id) as any;
    if (emp && isBoardMember(emp)) {
      return NextResponse.json(
        { error: 'Members of the Board of Directors are exempt from employee performance reviews.' },
        { status: 400 }
      );
    }

    const id = `rev-${Date.now()}`;
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO performance_reviews (
        id, employee_id, reviewer_id, review_period, rating,
        goals_achievement, strengths, areas_for_growth, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      employee_id,
      reviewer_id,
      review_period,
      Number(rating),
      Number(goals_achievement),
      strengths,
      areas_for_growth,
      status,
      createdAt
    );

    const created = db.prepare(`
      SELECT 
        pr.*,
        e.first_name || ' ' || e.last_name as employee_name,
        r.first_name || ' ' || r.last_name as reviewer_name
      FROM performance_reviews pr
      JOIN employees e ON e.id = pr.employee_id
      LEFT JOIN employees r ON r.id = pr.reviewer_id
      WHERE pr.id = ?
    `).get(id);

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
