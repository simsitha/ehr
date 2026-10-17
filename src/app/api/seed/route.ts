import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: 'Demo seed endpoint is permanently disabled in production.',
    },
    { status: 403 }
  );
}
