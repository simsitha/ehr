import { NextResponse } from 'next/server';
import { getITAssets, createITAsset, updateITAsset, deleteITAsset } from '@/lib/db';
import type { ITAssetCategory, ITAssetStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = (searchParams.get('category') as ITAssetCategory) || undefined;
    const status = (searchParams.get('status') as ITAssetStatus) || undefined;
    const assigned_to = searchParams.get('assigned_to') || undefined;
    const search = searchParams.get('search') || undefined;

    const assets = getITAssets({ category, status, assigned_to, search });
    return NextResponse.json(assets);
  } catch (error: any) {
    console.error('Error fetching IT assets:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch IT assets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.asset_tag || !body.category) {
      return NextResponse.json(
        { error: 'Name, Asset Tag, and Category are required.' },
        { status: 400 }
      );
    }

    const newAsset = createITAsset({
      asset_tag: body.asset_tag.trim(),
      name: body.name.trim(),
      category: body.category,
      brand: body.brand?.trim() || '',
      model: body.model?.trim() || '',
      serial_number: body.serial_number?.trim() || '',
      mac_address: body.mac_address?.trim() || '',
      ip_address: body.ip_address?.trim() || '',
      status: body.status || 'Available',
      condition: body.condition || 'New',
      purchase_date: body.purchase_date || null,
      purchase_cost: Number(body.purchase_cost) || 0,
      currency: body.currency || 'USD',
      warranty_expiry: body.warranty_expiry || null,
      vendor: body.vendor?.trim() || '',
      location: body.location?.trim() || '',
      department: body.department?.trim() || '',
      specifications: body.specifications?.trim() || '',
      notes: body.notes?.trim() || '',
      assigned_to: body.assigned_to || null,
      assigned_date: body.assigned_date || null,
      windows_operation: body.windows_operation?.trim() || body.os_version?.trim() || null,
      m365_account: body.m365_account?.trim() || null,
      local_account: body.local_account?.trim() || null,
      device_username: body.device_username?.trim() || body.username?.trim() || null,
      device_password: body.device_password?.trim() || body.password?.trim() || null,
    });

    return NextResponse.json(newAsset, { status: 201 });
  } catch (error: any) {
    console.error('Error creating IT asset:', error);
    return NextResponse.json({ error: error.message || 'Failed to create IT asset' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Asset ID is required.' }, { status: 400 });
    }

    const updated = updateITAsset(body.id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Asset not found.' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating IT asset:', error);
    return NextResponse.json({ error: error.message || 'Failed to update IT asset' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Asset ID is required.' }, { status: 400 });
    }

    const success = deleteITAsset(id);
    if (!success) {
      return NextResponse.json({ error: 'Asset not found or already deleted.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Asset deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting IT asset:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete IT asset' }, { status: 500 });
  }
}
