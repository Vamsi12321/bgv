import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl.clone();
  const host = req.headers.get("host") || "";
  const parts = host.split(".");
  const subdomain =
    parts.length > 2 && parts[0] !== "www" ? parts[0].toLowerCase() : null;

  // Identify org
  url.searchParams.set("org", subdomain || "superadmin");

  // Public paths
  const publicPaths = ["/login", "/favicon.ico"];
  const isPublic = publicPaths.some((path) => url.pathname.startsWith(path));

  // Session cookie
  const sessionCookie =
    req.cookies.get("bgvSession")?.value ||
    req.cookies.get("bgvTemp")?.value ||
    null;

  // Determine if this route requires authentication
  const isSuperOrAdmin =
    url.pathname.startsWith("/superadmin") || url.pathname.startsWith("/admin");
  const isOrgSubdomain =
    subdomain && subdomain !== "www" && subdomain !== "superadmin";
  const requiresAuth = isSuperOrAdmin || isOrgSubdomain;

  // 1️⃣ If user tries to access protected route without login → redirect to /login
  if (requiresAuth && !sessionCookie && !isPublic) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", url.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2️⃣ If logged in and tries to visit /login → redirect to their section
  if (url.pathname === "/login" && sessionCookie) {
    const redirectUrl = new URL(
      subdomain === "superadmin" ? "/superadmin" : "/",
      req.url
    );
    return NextResponse.redirect(redirectUrl);
  }

  // 3️⃣ Allow all other requests
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/public).*)"],
};
