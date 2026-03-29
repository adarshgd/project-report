import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret_for_dev_only_123");

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  // Paths that are always accessible
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    if (token) {
      try {
        await jwtVerify(token, SECRET);
        return NextResponse.redirect(new URL("/", request.url));
      } catch (e) {
        // invalid token, proceed to login
      }
    }
    return NextResponse.next();
  }

  // Check auth
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);
    
    // Admin only pages
    if (pathname.startsWith("/admin") && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    
    return NextResponse.next();
  } catch (err) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("auth_token");
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - logo.png (specific brand asset)
     * - all files with extensions (e.g. .png, .svg, .jpg)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|logo.png|.*\\..*).*)",
  ],
};
