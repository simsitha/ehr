import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import path from 'path';
import fs from 'fs';
import { restoreDatabase } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth-session';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;
  try {
    // 1. Authorization check
    let sessionCookie: string | undefined;
    let roleCookie: string | undefined;
    try {
      const cookieStore = await cookies();
      sessionCookie = cookieStore.get('hestra_session')?.value;
      roleCookie = cookieStore.get('hestra_role')?.value;
    } catch {
      if (request && 'cookies' in request && (request as any).cookies?.get) {
        sessionCookie = (request as any).cookies.get('hestra_session')?.value;
        roleCookie = (request as any).cookies.get('hestra_role')?.value;
      }
    }

    const session = await verifySessionToken(sessionCookie);
    const effectiveRole = session?.role || roleCookie;

    if (effectiveRole === 'Employee') {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient privileges to restore database' },
        { status: 403 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    let targetPath: string;
    let originalName: string;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');

      if (!file || typeof file !== 'object' || !('arrayBuffer' in file)) {
        return NextResponse.json(
          { success: false, error: 'No backup file provided in upload' },
          { status: 400 }
        );
      }

      const uploadFile = file as File;
      originalName = uploadFile.name;

      if (!originalName.match(/\.(sqlite|db|sqlite3|sql)$/i)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Unsupported file format. Please upload a SQLite database (.sqlite, .db, .sqlite3) or SQL script (.sql).',
          },
          { status: 400 }
        );
      }

      const tempDir = path.join(process.cwd(), 'data', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const arrayBuffer = await uploadFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Uploaded backup file is empty (0 bytes)' },
          { status: 400 }
        );
      }

      const safeBaseName = path.basename(originalName).replace(/[^a-zA-Z0-9._-]/g, '_');
      tempFilePath = path.join(tempDir, `restore_upload_${Date.now()}_${safeBaseName}`);
      fs.writeFileSync(tempFilePath, buffer);
      targetPath = tempFilePath;
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      const { fileName } = body;

      if (!fileName || typeof fileName !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Snapshot fileName is required' },
          { status: 400 }
        );
      }

      // Safe path checking
      const safeName = path.basename(fileName);
      const backupDir = path.join(process.cwd(), 'data', 'backups');
      const dataDir = path.join(process.cwd(), 'data');

      const pathInBackups = path.join(backupDir, safeName);
      const pathInData = path.join(dataDir, safeName);

      if (fs.existsSync(pathInBackups)) {
        targetPath = pathInBackups;
      } else if (fs.existsSync(pathInData)) {
        targetPath = pathInData;
      } else {
        return NextResponse.json(
          { success: false, error: `Selected snapshot "${safeName}" not found on server` },
          { status: 404 }
        );
      }

      originalName = safeName;
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid Content-Type. Expected multipart/form-data or application/json.' },
        { status: 400 }
      );
    }

    // Perform database restore
    const restoreResult = restoreDatabase(targetPath, originalName);

    return NextResponse.json({
      message: `Database restored successfully from "${originalName}"`,
      ...restoreResult,
    });
  } catch (error: any) {
    console.error('Error restoring database:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to restore database' },
      { status: 500 }
    );
  } finally {
    // Clean up temporary upload file and sidecars if created
    if (tempFilePath) {
      try {
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        if (fs.existsSync(`${tempFilePath}-wal`)) fs.unlinkSync(`${tempFilePath}-wal`);
        if (fs.existsSync(`${tempFilePath}-shm`)) fs.unlinkSync(`${tempFilePath}-shm`);
      } catch (err) {
        console.warn('Error deleting temp restore file:', err);
      }
    }
  }
}
