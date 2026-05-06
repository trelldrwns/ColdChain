import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const jwt = request.cookies.get('jwt');
  
  // Protect all dashboard routes
  const protectedRoutes = ['/dashboard', '/shipments', '/sensors', '/timeline'];
  const isProtected = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  if (isProtected && !jwt) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Allow root page to load for marketing/tracking
  // But if you want, you can redirect logged in users to dashboard:
  // if (request.nextUrl.pathname === '/' && jwt) {
  //   return NextResponse.redirect(new URL('/dashboard', request.url));
  // }

  // Redirect from login to dashboard if already logged in
  if (request.nextUrl.pathname === '/login' && jwt) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/shipments/:path*', '/sensors/:path*', '/timeline/:path*', '/login'],
};
