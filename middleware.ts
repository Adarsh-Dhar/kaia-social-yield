import { NextRequest, NextResponse } from "next/server"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const userSession = req.cookies.get("session")?.value || null
  const advertiserSession = req.cookies.get("adv_session")?.value || null

  // Home: route by role or to auth chooser
  if (pathname === "/") {
    const url = req.nextUrl.clone()
    if (advertiserSession) {
      url.pathname = "/advertiser"
      return NextResponse.redirect(url)
    }
    if (userSession) {
      url.pathname = "/user/dashboard"
      return NextResponse.redirect(url)
    }
    url.pathname = "/user/auth/choose"
    return NextResponse.redirect(url)
  }

  // Protect advertiser area
  if (pathname.startsWith("/advertiser") && !pathname.startsWith("/advertiser/auth") && !advertiserSession) {
    const url = req.nextUrl.clone()
    url.pathname = "/advertiser/auth"
    return NextResponse.redirect(url)
  }

  // Protect user area
  const userProtectedPrefixes = ["/user/dashboard", "/user/missions", "/user/profile", "/user/funds"]
  if (userProtectedPrefixes.some(prefix => pathname.startsWith(prefix)) && !userSession) {
    const url = req.nextUrl.clone()
    url.pathname = "/user/auth"
    return NextResponse.redirect(url)
  }

  // If already authenticated, avoid showing generic auth
  if (pathname === "/user/auth" || pathname === "/user/auth/choose") {
    const url = req.nextUrl.clone()
    if (advertiserSession) {
      url.pathname = "/advertiser"
      return NextResponse.redirect(url)
    }
    if (userSession) {
      url.pathname = "/user/dashboard"
      return NextResponse.redirect(url)
    }
  }

  // Legacy redirects
  if (pathname === "/auth") {
    const url = req.nextUrl.clone()
    url.pathname = "/user/auth"
    return NextResponse.redirect(url)
  }
  if (pathname === "/auth/choose") {
    const url = req.nextUrl.clone()
    url.pathname = "/user/auth/choose"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/",
    "/auth",
    "/auth/choose",
    "/user/auth",
    "/user/auth/choose",
    "/advertiser/:path*",
    "/user/dashboard",
    "/user/missions",
    "/user/profile",
    "/user/funds/:path*",
  ],
}


