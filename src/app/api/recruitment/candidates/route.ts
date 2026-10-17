import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { JobCandidate } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('job_id');
    const stage = searchParams.get('stage');

    let sql = `
      SELECT 
        c.*,
        j.title as job_title
      FROM job_candidates c
      LEFT JOIN job_postings j ON j.id = c.job_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (jobId && jobId !== 'all') {
      sql += ` AND c.job_id = ?`;
      params.push(jobId);
    }

    if (stage && stage !== 'all') {
      sql += ` AND c.stage = ?`;
      params.push(stage);
    }

    sql += ` ORDER BY c.applied_date DESC`;

    const candidates = db.prepare(sql).all(...params) as JobCandidate[];
    return NextResponse.json(candidates);
  } catch (error: any) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const {
      job_id,
      name,
      email,
      phone = '',
      stage = 'Applied',
      rating = 4,
      notes = '',
    } = body;

    if (!job_id || !name || !email) {
      return NextResponse.json({ error: 'job_id, name, and email are required' }, { status: 400 });
    }

    const id = `cand-${Date.now()}`;
    const appliedDate = new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO job_candidates (
        id, job_id, name, email, phone, stage, rating, applied_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, job_id, name, email, phone, stage, Number(rating), appliedDate, notes);

    // Increment applicants_count on job
    db.prepare('UPDATE job_postings SET applicants_count = applicants_count + 1 WHERE id = ?').run(job_id);

    const created = db.prepare(`
      SELECT c.*, j.title as job_title
      FROM job_candidates c
      LEFT JOIN job_postings j ON j.id = c.job_id
      WHERE c.id = ?
    `).get(id);

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('Error creating candidate:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { id, stage, rating, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Candidate id is required' }, { status: 400 });
    }

    db.prepare(`
      UPDATE job_candidates SET
        stage = COALESCE(?, stage),
        rating = COALESCE(?, rating),
        notes = COALESCE(?, notes)
      WHERE id = ?
    `).run(stage || null, rating !== undefined ? Number(rating) : null, notes || null, id);

    const updated = db.prepare(`
      SELECT c.*, j.title as job_title
      FROM job_candidates c
      LEFT JOIN job_postings j ON j.id = c.job_id
      WHERE c.id = ?
    `).get(id);

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating candidate:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
