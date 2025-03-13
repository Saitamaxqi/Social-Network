import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware will handle authentication for protected routes
export async function middleware(request: NextRequest) {
  // Skip middleware for API routes as they handle their own authentication
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Protected page routes that require authentication
  const protectedPageRoutes = [
    '/posts/create',
    '/createpost'
  ];
  
  // Check if the current path is a protected page route
  const isProtectedPageRoute = protectedPageRoutes.some(route => 
    request.nextUrl.pathname === route
  );
  
  if (isProtectedPageRoute) {
    // Check for authentication cookies
    const hasCookies = request.cookies.has('auth_token') || 
                      request.cookies.has('session') || 
                      request.cookies.has('token');
    
    // If no authentication cookies found, redirect to login
    if (!hasCookies) {
      const url = new URL('/auth/login', request.url);
      url.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }
  
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    '/posts/create',
    '/createpost'
  ],
};
