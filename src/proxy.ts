import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/auth-session';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets, Next.js internal bundles, and public files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/iclock') ||
    pathname === '/favicon.ico' ||
    pathname === '/hestra-logo.svg' ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$/i)
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('hestra_session')?.value;
  const verifiedSession = await verifySessionToken(sessionCookie);

  const authCookie = verifiedSession?.userId || request.cookies.get('hestra_auth')?.value;
  // If cryptographically verified session exists, enforce verified session role
  const roleCookie = verifiedSession?.role || request.cookies.get('hestra_role')?.value;

  // API RBAC Checks
  if (pathname.startsWith('/api/')) {
    if (pathname.startsWith('/api/security')) {
      if (roleCookie !== 'Admin' && roleCookie !== 'IT Support') {
        return NextResponse.json(
          {
            error: 'Forbidden: Security management requires Admin or IT Support role',
          },
          { status: 403 }
        );
      }
    }

    if (roleCookie === 'Employee') {
      // Prohibit employee from sensitive admin/management APIs
      if (
        pathname.startsWith('/api/users') ||
        pathname.startsWith('/api/settings') ||
        pathname.startsWith('/api/reports') ||
        pathname.startsWith('/api/seed') ||
        pathname.startsWith('/api/recruitment/seed') ||
        (pathname.startsWith('/api/inventory') && ['POST', 'PUT', 'DELETE'].includes(request.method)) ||
        (pathname.startsWith('/api/payroll') && request.method !== 'GET') ||
        (pathname.startsWith('/api/employees') && ['POST', 'PUT', 'DELETE'].includes(request.method)) ||
        (pathname.startsWith('/api/departments') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) ||
        (pathname.startsWith('/api/announcements') && ['POST', 'PUT', 'DELETE'].includes(request.method)) ||
        (pathname.startsWith('/api/leaves') && ['PATCH', 'PUT', 'DELETE'].includes(request.method)) ||
        (pathname.startsWith('/api/requests') && ['PATCH', 'PUT'].includes(request.method))
      ) {
        return NextResponse.json(
          {
            error: 'Forbidden: Employee role has limited administrative permissions',
          },
          { status: 403 }
        );
      }
    }
    return NextResponse.next();
  }

  // If user is accessing the login page
  if (pathname === '/login') {
    // If logout is requested via query param, clear all auth cookies and allow login page to render
    if (request.nextUrl.searchParams.has('logout')) {
      const response = NextResponse.next();
      response.cookies.set('hestra_session', '', { path: '/', maxAge: 0, expires: new Date(0) });
      response.cookies.set('hestra_auth', '', { path: '/', maxAge: 0, expires: new Date(0) });
      response.cookies.set('hestra_role', '', { path: '/', maxAge: 0, expires: new Date(0) });
      return response;
    }

    // If already authenticated, redirect to portal or dashboard
    if (authCookie && sessionCookie && verifiedSession) {
      if (roleCookie === 'Employee') {
        return NextResponse.redirect(new URL('/portal/staff', request.url));
      }
      // Both Manager and Admin redirect to the Dashboard
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // If user is NOT authenticated, redirect to /login
  if (!authCookie) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Role-Based Access Control (RBAC) for Pages
  if (roleCookie === 'Employee') {
    // Strictly restrict employees to Employee Self-Service (ESS), Leaves, Attendance, Departments directory, and public company notices
    const isAllowedForEmployee =
      pathname === '/portal/staff' ||
      pathname.startsWith('/portal/staff') ||
      pathname === '/attendance' ||
      pathname.startsWith('/attendance') ||
      pathname === '/leaves' ||
      pathname.startsWith('/leaves') ||
      pathname === '/announcements' ||
      pathname.startsWith('/announcements') ||
      pathname === '/requests' ||
      pathname.startsWith('/requests') ||
      pathname === '/departments' ||
      pathname.startsWith('/departments') ||
      pathname === '/inventory' ||
      pathname.startsWith('/inventory') ||
      pathname === '/structure' ||
      pathname.startsWith('/structure') ||
      pathname === '/roster' ||
      pathname.startsWith('/roster') ||
      pathname === '/overtime' ||
      pathname.startsWith('/overtime');

    if (!isAllowedForEmployee) {
      const redirectUrl = new URL('/portal/staff', request.url);
      redirectUrl.searchParams.set('restricted', '1');
      return NextResponse.redirect(redirectUrl);
    }
  } else if (roleCookie === 'Manager') {
    // Restrict managers from full user administration, system settings, executive reports, and bulk payroll
    if (
      pathname.startsWith('/users') ||
      pathname.startsWith('/settings') ||
      pathname.startsWith('/reports') ||
      pathname.startsWith('/payroll') ||
      pathname.startsWith('/security')
    ) {
      return NextResponse.redirect(new URL('/portal/manager', request.url));
    }
  }

  // Intelligent root navigation based on role
  if (pathname === '/') {
    if (roleCookie === 'Employee') {
      return NextResponse.redirect(new URL('/portal/staff', request.url));
    }
    // Managers and Admins access the Dashboard ('/') directly
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
