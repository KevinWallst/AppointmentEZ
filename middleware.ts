import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  // Only protect admin routes (excluding login)
  if (path.startsWith('/admin') && !path.includes('/admin/login')) {
    // Check if the user is authenticated via cookie
    const adminAuthenticated = request.cookies.get('adminAuthenticated');
    
    // If not authenticated, redirect to login
    if (!adminAuthenticated || adminAuthenticated.value !== 'true') {
      // Create the URL for the login page
      const loginUrl = new URL('/admin/login', request.url);
      
      // Add the original URL as a parameter to redirect back after login
      loginUrl.searchParams.set('from', request.nextUrl.pathname);
      
      // Redirect to the login page
      return NextResponse.redirect(loginUrl);
    }
  }
  
  // Continue with the request
  return NextResponse.next();
}

// Configure the paths that should be processed by this middleware
export const config = {
  matcher: [
    // Match all admin routes
    '/admin/:path*',
  ],
};
