import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { isAdminRole } from "@/lib/constants"

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Let NextAuth handle its own routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  const token = await getToken({ req: request })

  // Public pages — no auth required
  if (pathname === "/" || pathname === "/login") {
    if (token && pathname === "/login") {
      return addSecurityHeaders(NextResponse.redirect(new URL("/student", request.url)))
    }
    return addSecurityHeaders(NextResponse.next())
  }

  // All other pages require authentication
  if (!token) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return addSecurityHeaders(NextResponse.redirect(loginUrl))
  }

  const role = token.role as string | undefined

  // /admin/* — admin roles only
  if (pathname.startsWith("/admin")) {
    if (!role || !isAdminRole(role as any)) {
      return addSecurityHeaders(NextResponse.redirect(new URL("/", request.url)))
    }

    // /admin/technicians, /admin/reports — EE/Dean only
    if (
      (pathname.startsWith("/admin/technicians") ||
        pathname.startsWith("/admin/reports")) &&
      role !== "EE" &&
      role !== "Dean"
    ) {
      return addSecurityHeaders(NextResponse.redirect(new URL("/admin", request.url)))
    }

    // /admin/track — redirect to complaints
    if (pathname.startsWith("/admin/track")) {
      return addSecurityHeaders(NextResponse.redirect(new URL("/admin/complaints", request.url)))
    }

    return addSecurityHeaders(NextResponse.next())
  }

  // /hall-office — HallOffice role only
  if (pathname.startsWith("/hall-office")) {
    if (role !== "HallOffice") {
      return addSecurityHeaders(NextResponse.redirect(new URL("/", request.url)))
    }
    return addSecurityHeaders(NextResponse.next())
  }

  // /student — User role only
  if (pathname.startsWith("/student")) {
    if (role !== "User") {
      return addSecurityHeaders(NextResponse.redirect(new URL("/admin", request.url)))
    }
    return addSecurityHeaders(NextResponse.next())
  }

  // /api/logs — EE/Dean only
  if (pathname.startsWith("/api/logs")) {
    if (role !== "EE" && role !== "Dean") {
      return addSecurityHeaders(
        new NextResponse(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }),
      )
    }
    return addSecurityHeaders(NextResponse.next())
  }

  // /register, /track — User role only
  if (pathname.startsWith("/register") || pathname.startsWith("/track")) {
    if (role !== "User") {
      return addSecurityHeaders(NextResponse.redirect(new URL("/admin", request.url)))
    }
    return addSecurityHeaders(NextResponse.next())
  }

  // /feedback — any authenticated user
  return addSecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
