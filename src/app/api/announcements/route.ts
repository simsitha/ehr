import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Announcement } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    const announcements = db.prepare(`
      SELECT 
        a.*,
        e.first_name || ' ' || e.last_name as author_name
      FROM announcements a
      LEFT JOIN employees e ON e.id = a.author_id
      ORDER BY a.pinned DESC, a.created_at DESC
    `).all() as Announcement[];

    return NextResponse.json(announcements);
  } catch (error: any) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { title, content, author_id = 'usr-admin', category = 'General', pinned = 0 } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const id = `ann-${Date.now()}`;
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO announcements (id, title, content, author_id, category, pinned, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, title, content, author_id, category, pinned ? 1 : 0, createdAt);

    const created = db.prepare(`
      SELECT a.*, e.first_name || ' ' || e.last_name as author_name
      FROM announcements a
      LEFT JOIN employees e ON e.id = a.author_id
      WHERE a.id = ?
    `).get(id);

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('Error creating announcement:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const db = getDb();
    db.prepare('DELETE FROM announcements').run();
    return NextResponse.json({ success: true, message: 'All announcements have been cleared.' });
  } catch (error: any) {
    console.error('Error clearing announcements:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
