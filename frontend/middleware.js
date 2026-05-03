import { NextResponse } from "next/server";

export function middleware(request) {
  const token = request.cookies.get("token");

  const url = request.nextUrl.pathname;

  // Protect admin
  if (url.startsWith("/admin") && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Protect vendor
  if (url.startsWith("/vendor") && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}