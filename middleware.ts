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
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }
    url.pathname = "/auth/choose"
    return NextResponse.redirect(url)
  }

  // Protect advertiser area
  if (pathname.startsWith("/advertiser") && !advertiserSession) {
    const url = req.nextUrl.clone()
    url.pathname = "/advertiser/auth"
    return NextResponse.redirect(url)
  }

  // Protect user area
  const userProtectedPrefixes = ["/dashboard", "/missions", "/profile", "/funds"]
  if (userProtectedPrefixes.some(prefix => pathname.startsWith(prefix)) && !userSession) {
    const url = req.nextUrl.clone()
    url.pathname = "/auth"
    return NextResponse.redirect(url)
  }

  // If already authenticated, avoid showing generic auth
  if (pathname === "/auth" || pathname === "/auth/choose") {
    const url = req.nextUrl.clone()
    if (advertiserSession) {
      url.pathname = "/advertiser"
      return NextResponse.redirect(url)
    }
    if (userSession) {
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/",
    "/auth",
    "/auth/choose",
    "/advertiser/:path*",
    "/dashboard",
    "/missions",
    "/profile",
    "/funds/:path*",
  ],
}


