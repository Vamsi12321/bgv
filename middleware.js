import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl.clone();
  const host = req.headers.get("host") || "";
  const parts = host.split(".");
  const subdomain =
    parts.length > 2 && parts[0] !== "www" ? parts[0].toLowerCase() : null;

  /**
   * ----------------------------------------------------------------------------
   * 0️⃣  CANDIDATE ROUTES — ALWAYS PUBLIC (NO AUTH REQUIRED)
   * ----------------------------------------------------------------------------
   */
  if (url.pathname.startsWith("/candidate")) {
    // Candidate flows must NOT require login even under org subdomains.
    return NextResponse.next();
  }

  /**
   * ----------------------------------------------------------------------------
   * 1️⃣  Attach org to search params (your existing logic)
   * ----------------------------------------------------------------------------
   */
  url.searchParams.set("org", subdomain || "superadmin");

  /**
   * ----------------------------------------------------------------------------
   * 2️⃣ Public routes — accessible without authentication
   * ----------------------------------------------------------------------------
   */
  const publicPaths = [
    "/login",
    "/favicon.ico",
    "/candidate/self-verification", // extra safety (even though we bypass earlier)
  ];
  const isPublic = publicPaths.some((path) => url.pathname.startsWith(path));

  /**
   * ----------------------------------------------------------------------------
   * 3️⃣ Session cookie detection
   * ----------------------------------------------------------------------------
   */
  const sessionCookie =
    req.cookies.get("bgvSession")?.value ||
    req.cookies.get("bgvTemp")?.value ||
    null;

  /**
   * ----------------------------------------------------------------------------
   * 4️⃣ Determine if route requires authentication
   * ----------------------------------------------------------------------------
   * These paths should require authentication:
   *  - /superadmin/*
   *  - /admin/*
   *  - Any route at an org subdomain
   *
   * Your existing logic preserved exactly.
   * ----------------------------------------------------------------------------
   */
  const isSuperOrAdmin =
    url.pathname.startsWith("/superadmin") || url.pathname.startsWith("/admin");

  const isOrgSubdomain =
    subdomain && subdomain !== "www" && subdomain !== "superadmin";

  const requiresAuth = isSuperOrAdmin || isOrgSubdomain;

  /**
   * ----------------------------------------------------------------------------
   * 5️⃣ If route requires auth but user has no session → redirect to login
   * ----------------------------------------------------------------------------
   */
  if (requiresAuth && !sessionCookie && !isPublic) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", url.pathname);
    return NextResponse.redirect(loginUrl);
  }

  /**
   * ----------------------------------------------------------------------------
   * 6️⃣ If logged in and trying to access /login → redirect away
   * ----------------------------------------------------------------------------
   */
  if (url.pathname === "/login" && sessionCookie) {
    const redirectUrl = new URL(
      subdomain === "superadmin" ? "/superadmin" : "/",
      req.url
    );
    return NextResponse.redirect(redirectUrl);
  }

  /**
   * ----------------------------------------------------------------------------
   * 7️⃣ Default — allow access
   * ----------------------------------------------------------------------------
   */
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/public).*)"],
};
