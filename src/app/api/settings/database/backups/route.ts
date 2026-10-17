import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDatabaseDiagnostics } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth-session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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
        { error: 'Forbidden: Insufficient privileges' },
        { status: 403 }
      );
    }

    const diagnostics = getDatabaseDiagnostics();
    return NextResponse.json({
      success: true,
      diagnostics,
    });
  } catch (error: any) {
    console.error('Error fetching database diagnostics:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch database diagnostics' },
      { status: 500 }
    );
  }
}
