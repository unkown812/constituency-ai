import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

const PUBLIC_ROUTES = ["/", "/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_ROUTES.some((route) =>
    pathname === route || pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".")
  );

  if (isPublic) {
    return NextResponse.next();
  }

  const { supabaseResponse, user } = await updateSession(request);

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = user.user_metadata?.role ?? "citizen";

  if (pathname.startsWith("/dashboard") && role !== "mp" && role !== "admin") {
    return NextResponse.redirect(new URL("/citizen", request.url));
  }

  if (pathname.startsWith("/citizen") && role !== "citizen" && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
