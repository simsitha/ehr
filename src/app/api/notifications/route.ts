import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  createNotification,
} from '@/lib/db';
import { NotificationType } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function resolveUserAndRole(request: Request) {
  const { searchParams } = new URL(request.url);
  let cookieUserId: string | undefined;
  let cookieRole: string | undefined;

  try {
    const cookieStore = await cookies();
    cookieUserId = cookieStore.get('hestra_auth')?.value;
    cookieRole = cookieStore.get('hestra_role')?.value;
  } catch {
    if (request && 'cookies' in request && (request as any).cookies?.get) {
      cookieUserId = (request as any).cookies.get('hestra_auth')?.value;
      cookieRole = (request as any).cookies.get('hestra_role')?.value;
    }
  }

  const userId = searchParams.get('user_id') || cookieUserId || null;
  const role = searchParams.get('role') || cookieRole || 'All';

  return { userId, role };
}

export async function GET(request: Request) {
  try {
    const { userId, role } = await resolveUserAndRole(request);
    const { searchParams } = new URL(request.url);

    const unreadOnly = searchParams.get('unread_only') === 'true';
    const limit = searchParams.has('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;

    const notifications = getNotifications({
      userId,
      role,
      limit,
      unreadOnly,
    });

    const unreadCount = getUnreadNotificationsCount({
      userId,
      role,
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId, role } = await resolveUserAndRole(request);
    const body = await request.json().catch(() => ({}));

    if (body.all) {
      const count = markAllNotificationsAsRead({ userId, role });
      const unreadCount = getUnreadNotificationsCount({ userId, role });
      return NextResponse.json({
        success: true,
        markedCount: count,
        unreadCount,
      });
    }

    if (body.id) {
      const isRead = body.is_read !== false; // default true unless explicitly false
      const success = markNotificationAsRead(body.id, isRead);
      const unreadCount = getUnreadNotificationsCount({ userId, role });
      return NextResponse.json({
        success,
        id: body.id,
        is_read: isRead,
        unreadCount,
      });
    }

    return NextResponse.json(
      { error: 'id or all:true is required' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId, role } = await resolveUserAndRole(request);
    const { searchParams } = new URL(request.url);
    const paramId = searchParams.get('id');
    const paramAll = searchParams.get('all') === 'true';

    let bodyId = null;
    let bodyAll = false;
    try {
      const body = await request.json();
      bodyId = body?.id;
      bodyAll = Boolean(body?.all);
    } catch {}

    const isAll = paramAll || bodyAll;
    const targetId = paramId || bodyId;

    if (isAll) {
      const deletedCount = clearAllNotifications({ userId, role });
      return NextResponse.json({
        success: true,
        deletedCount,
        unreadCount: 0,
      });
    }

    if (targetId) {
      const success = deleteNotification(targetId);
      const unreadCount = getUnreadNotificationsCount({ userId, role });
      return NextResponse.json({
        success,
        id: targetId,
        unreadCount,
      });
    }

    return NextResponse.json(
      { error: 'id or all:true is required to delete' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error deleting notification(s):', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      title_km,
      message,
      message_km,
      type = 'system',
      link = '/',
      role = 'All',
      user_id = null,
      is_read = false,
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const notification = createNotification({
      title,
      title_km,
      message,
      message_km,
      type: type as NotificationType,
      link,
      role,
      user_id,
      is_read,
    });

    return NextResponse.json({
      success: true,
      notification,
    });
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
