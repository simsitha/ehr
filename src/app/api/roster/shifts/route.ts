import { NextResponse } from 'next/server';
import { getShiftSettings, updateShiftSettings, resetShiftSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = getShiftSettings();
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error fetching shift templates and settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'reset') {
      const reset = resetShiftSettings();
      return NextResponse.json({
        success: true,
        message: 'គំរូវេនការងារត្រូវបានកំណត់ឡើងវិញតាមលំនាំដើម (Shift templates reset to defaults)',
        settings: reset,
      });
    }

    const body = await request.json();
    if (body.action === 'reset') {
      const reset = resetShiftSettings();
      return NextResponse.json({
        success: true,
        message: 'គំរូវេនការងារត្រូវបានកំណត់ឡើងវិញតាមលំនាំដើម (Shift templates reset to defaults)',
        settings: reset,
      });
    }

    const updated = updateShiftSettings(body);
    return NextResponse.json({
      success: true,
      message: 'បានរក្សាទុកគំរូវេនការងារដោយជោគជ័យ (Shift templates updated successfully)',
      settings: updated,
    });
  } catch (error: any) {
    console.error('Error updating shift settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const reset = resetShiftSettings();
    return NextResponse.json({
      success: true,
      message: 'Shift templates reset to defaults',
      settings: reset,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
