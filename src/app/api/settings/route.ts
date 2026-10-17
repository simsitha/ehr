import { NextResponse } from 'next/server';
import { getCompanySettings, updateCompanySettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = getCompanySettings();
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error fetching company settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const updated = updateCompanySettings(body);
    return NextResponse.json({
      success: true,
      message: 'Corporate settings saved successfully',
      settings: updated,
    });
  } catch (error: any) {
    console.error('Error updating company settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  return POST(request);
}
