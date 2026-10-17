import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import path from 'path';
import fs from 'fs';
import { backupDatabase } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth-session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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
        { error: 'Forbidden: Insufficient privileges to backup database' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedFile = searchParams.get('file');
    const mode = searchParams.get('mode');

    let filePath: string;
    let fileName: string;
    let fileSize: number;

    if (requestedFile) {
      // Downloading an existing backup file
      const safeName = path.basename(requestedFile);
      const backupDir = path.join(process.cwd(), 'data', 'backups');
      const dataDir = path.join(process.cwd(), 'data');

      const pathInBackups = path.join(backupDir, safeName);
      const pathInData = path.join(dataDir, safeName);

      if (fs.existsSync(pathInBackups)) {
        filePath = pathInBackups;
      } else if (fs.existsSync(pathInData)) {
        filePath = pathInData;
      } else {
        return NextResponse.json(
          { error: 'Backup file not found' },
          { status: 404 }
        );
      }

      fileName = safeName;
      fileSize = fs.statSync(/*turbopackIgnore: true*/ filePath).size;
    } else {
      // Generate a fresh live snapshot
      const backupResult = await backupDatabase();
      filePath = backupResult.backupPath;
      fileName = backupResult.fileName;
      fileSize = backupResult.size;

      if (mode === 'json') {
        return NextResponse.json({
          success: true,
          ...backupResult,
          downloadUrl: `/api/settings/database/backup?file=${encodeURIComponent(fileName)}`,
        });
      }
    }

    const fileBuffer = fs.readFileSync(/*turbopackIgnore: true*/ filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': fileName.endsWith('.sql') ? 'application/sql' : 'application/vnd.sqlite3',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': String(fileSize),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Backup-Filename': fileName,
        'X-Backup-Size': String(fileSize),
      },
    });
  } catch (error: any) {
    console.error('Error generating database backup:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create database backup' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
        { error: 'Forbidden: Insufficient privileges to backup database' },
        { status: 403 }
      );
    }

    const backupResult = await backupDatabase();

    return NextResponse.json({
      success: true,
      message: 'PostgreSQL database backup created successfully',
      ...backupResult,
      downloadUrl: `/api/settings/database/backup?file=${encodeURIComponent(backupResult.fileName)}`,
    });
  } catch (error: any) {
    console.error('Error creating database backup:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create database backup' },
      { status: 500 }
    );
  }
}
