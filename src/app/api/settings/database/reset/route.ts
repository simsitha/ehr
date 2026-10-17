import { NextResponse } from 'next/server';
import { resetDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const result = resetDatabase();
    return NextResponse.json({
      success: true,
      message: 'Database reset to initial baseline state successfully',
      tableCounts: result.tableCounts,
    });
  } catch (error: any) {
    console.error('Error resetting database:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reset database' },
      { status: 500 }
    );
  }
}
