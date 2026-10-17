import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: 'Recruitment sample data restore is permanently disabled in production.',
    },
    { status: 403 }
  );
}
