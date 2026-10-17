import { NextResponse } from 'next/server';
import { getOvertimeSettings, updateOvertimeSettings, resetOvertimeSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = getOvertimeSettings();
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error fetching overtime settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'reset') {
      const reset = resetOvertimeSettings();
      return NextResponse.json({
        success: true,
        message: 'អត្រាថែមម៉ោងត្រូវបានកំណត់ឡើងវិញតាមច្បាប់ការងារកម្ពុជា (Overtime rates reset to Cambodian Labor Law statutory defaults)',
        settings: reset,
      });
    }

    const body = await request.json();
    const updated = updateOvertimeSettings(body);
    return NextResponse.json({
      success: true,
      message: 'បានរក្សាទុកកម្រងអត្រាថែមម៉ោងដោយជោគជ័យ (Overtime statutory rates updated successfully)',
      settings: updated,
    });
  } catch (error: any) {
    console.error('Error updating overtime settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const reset = resetOvertimeSettings();
    return NextResponse.json({
      success: true,
      message: 'Overtime rates reset to Cambodian Labor Law statutory defaults',
      settings: reset,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
