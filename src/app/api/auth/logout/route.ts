import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });

  // Clear HTTP-Only session token
  response.cookies.set('hestra_session', '', {
    path: '/',
    httpOnly: true,
    maxAge: 0,
    expires: new Date(0),
    sameSite: 'lax',
  });

  // Clear client cookies
  response.cookies.set('hestra_auth', '', {
    path: '/',
    httpOnly: false,
    maxAge: 0,
    expires: new Date(0),
    sameSite: 'lax',
  });

  response.cookies.set('hestra_role', '', {
    path: '/',
    httpOnly: false,
    maxAge: 0,
    expires: new Date(0),
    sameSite: 'lax',
  });

  return response;
}

export async function GET() {
  return POST();
}
