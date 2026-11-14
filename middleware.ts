import { NextResponse, type NextRequest } from "next/server";
import { TEACHER_SESSION_COOKIE, verifyTeacherSessionToken } from "./lib/session-token";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/teacher/login") return NextResponse.next();

  const isAuthenticated = await verifyTeacherSessionToken(
    request.cookies.get(TEACHER_SESSION_COOKIE)?.value,
    process.env.SESSION_SECRET,
  );
  if (isAuthenticated) return NextResponse.next();

  const loginUrl = new URL("/teacher/login", request.url);
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/teacher/:path*"],
};
