import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { JobPosting } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let sql = `
      SELECT 
        j.*,
        d.name as department_name,
        count(c.id) as real_candidate_count
      FROM job_postings j
      LEFT JOIN departments d ON d.id = j.department_id
      LEFT JOIN job_candidates c ON c.job_id = j.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      sql += ` AND j.status = ?`;
      params.push(status);
    }

    sql += ` GROUP BY j.id, d.name ORDER BY j.posted_date DESC`;

    const jobs = db.prepare(sql).all(...params) as JobPosting[];
    return NextResponse.json(jobs);
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const {
      title,
      department_id,
      location = 'Remote / Hybrid',
      type = 'Full-Time',
      experience_level = 'Mid-Senior',
      salary_range = '$120k - $160k',
      description = '',
      requirements = '',
      status = 'Active',
    } = body;

    if (!title || !department_id) {
      return NextResponse.json({ error: 'Title and department_id are required' }, { status: 400 });
    }

    const id = `job-${Date.now()}`;
    const postedDate = new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO job_postings (
        id, title, department_id, location, type, experience_level,
        salary_range, description, requirements, status, posted_date, applicants_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      id,
      title,
      department_id,
      location,
      type,
      experience_level,
      salary_range,
      description,
      requirements,
      status,
      postedDate
    );

    const created = db.prepare(`
      SELECT j.*, d.name as department_name
      FROM job_postings j
      LEFT JOIN departments d ON d.id = j.department_id
      WHERE j.id = ?
    `).get(id);

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('Error creating job posting:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { getDb, clearAllRecruitment } = await import('@/lib/db');
    const db = getDb();
    clearAllRecruitment(db);
    return NextResponse.json({ success: true, message: 'All job postings and candidates have been cleared.' });
  } catch (error: any) {
    console.error('Error clearing recruitment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
