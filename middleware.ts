import { NextRequest, NextResponse } from "next/server"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // If visiting home and unauthenticated, send to /auth
  if (pathname === "/") {
    const session = req.cookies.get("session")?.value
    if (!session) {
      const url = req.nextUrl.clone()
      url.pathname = "/auth"
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/"],
}


