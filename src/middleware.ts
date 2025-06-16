import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from 'next/server'

// Create a middleware function that handles both auth and favicon
export default withAuth(
  function middleware(req) {
    // Handle favicon.ico requests
    if (req.nextUrl.pathname === '/favicon.ico') {
      return NextResponse.redirect(new URL('/logo-ico.png', req.url))
    }

    // Handle authenticated users trying to access auth pages
    if (
      req.nextUrl.pathname.startsWith("/login") ||
      req.nextUrl.pathname.startsWith("/register")
    ) {
      if (req.nextauth.token) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth-related API routes
        if (req.nextUrl.pathname.startsWith("/api/auth")) {
          return true;
        }
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/favicon.ico",
    "/dashboard/:path*",
    "/api/:path*",
    "/login",
    "/register",
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
}; 