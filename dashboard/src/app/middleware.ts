import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Configuration
const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET
);

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/_next',
  '/favicon.ico',
];

const PROTECTED_API_PATHS = [
  '/api/webhooks',
  '/api/metrics',
  '/api/dlq',
  '/api/settings',
];

// Helper function to check if path is public
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname.startsWith(path));
}

// Helper function to check if path needs API authentication
function isProtectedApiPath(pathname: string): boolean {
  return PROTECTED_API_PATHS.some(path => pathname.startsWith(path));
}

// Verify JWT token
async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, SECRET_KEY);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Get token from httpOnly cookie
  const token = request.cookies.get('access_token')?.value;

  // Check if this is a protected API route
  if (isProtectedApiPath(pathname)) {
    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const isValidToken = await verifyToken(token);
    if (!isValidToken) {
      // Try to refresh token
      const refreshToken = request.cookies.get('refresh_token')?.value;
      if (refreshToken) {
        try {
          // In a real implementation, you'd verify the refresh token
          // and issue a new access token here
          // For now, we'll return 401 to trigger client-side refresh
          return new NextResponse(
            JSON.stringify({ error: 'Token expired', code: 'TOKEN_EXPIRED' }),
            { 
              status: 401,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        } catch {
          return new NextResponse(
            JSON.stringify({ error: 'Authentication required' }),
            { 
              status: 401,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      }

      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Add user info to headers for API routes
    const response = NextResponse.next();
    response.headers.set('x-user-authenticated', 'true');
    return response;
  }

  // For non-API protected routes (dashboard pages)
  if (!token) {
    // Redirect to login page
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isValidToken = await verifyToken(token);
  if (!isValidToken) {
    // Check for refresh token
    const refreshToken = request.cookies.get('refresh_token')?.value;
    if (refreshToken) {
      // Redirect to refresh endpoint
      const refreshUrl = new URL('/api/auth/refresh', request.url);
      return NextResponse.redirect(refreshUrl);
    }

    // No valid tokens, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
