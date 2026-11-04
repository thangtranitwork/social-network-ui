import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get("accessToken")?.value;
  const adminToken = request.cookies.get("admin_token")?.value;
  const adminRole = request.cookies.get("admin_role")?.value;

  // 1. Admin Dashboard Protection
  if (pathname.startsWith("/admin/dashboard")) {
    if (!accessToken && !adminToken) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Admin Login - Redirect to Dashboard if already authenticated
  if (pathname === "/admin/login") {
    if (adminToken || (accessToken && adminRole === "ADMIN")) {
      const dashboardUrl = new URL("/admin/dashboard/users", request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // 3. User Protected Routes
  const userProtectedRoutes = ["/home", "/chats", "/friends", "/search", "/settings", "/profile"];
  const isUserProtectedRoute = userProtectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isUserProtectedRoute) {
    if (!accessToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 4. Auth Pages (Login / Register) - Redirect to /home if already logged in
  if (pathname === "/login" || pathname === "/register") {
    if (accessToken) {
      const homeUrl = new URL("/home", request.url);
      return NextResponse.redirect(homeUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/home/:path*",
    "/chats/:path*",
    "/friends/:path*",
    "/search/:path*",
    "/settings/:path*",
    "/profile/:path*",
    "/login",
    "/register",
  ],
};
