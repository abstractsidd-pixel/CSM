import { NextRequest, NextResponse } from "next/server"
import { unsign } from "@/lib/session-crypto"
import { isAdminRole } from "@/lib/constants"
import type { Role } from "@/lib/constants"

const COOKIE = "cms_session"

type Session = {
  role: Role
  email: string
  name: string
  userId?: number
  staffId?: number
  subdivision?: string | null
}

async function getSessionFromMiddleware(raw: string): Promise<Session | null> {
  try {
    const payload = await unsign(raw)
    if (!payload) return null
    return JSON.parse(payload) as Session
  } catch {
    return null
  }
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self'",
      "connect-src 'self' https://vitals.vercel-insights.com",
      "frame-ancestors 'none'",
    ].join("; "),
  )
  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const raw = request.cookies.get(COOKIE)?.value
  const session = raw ? await getSessionFromMiddleware(raw) : null

  // Public pages — no auth required
  if (pathname === "/" || pathname === "/login") {
    return addSecurityHeaders(NextResponse.next())
  }

  // All other pages require authentication
  if (!session) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return addSecurityHeaders(NextResponse.redirect(loginUrl))
  }

  const role = session.role

  // /admin/* — admin roles only
  if (pathname.startsWith("/admin")) {
    if (!isAdminRole(role)) {
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

  // /register, /track, /feedback — any authenticated user
  return addSecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
