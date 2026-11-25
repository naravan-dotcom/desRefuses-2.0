import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { canOpenDashboard, homeForUser } from "@/lib/access";

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie: request.nextUrl.protocol === "https:",
  });
  const user = token
    ? {
        id: token.id,
        dbId: token.dbId,
        role: token.role,
        status: token.status,
        name: token.name,
        username: token.username,
        email: token.email,
        image: token.avatar ?? token.picture,
      }
    : null;

  if (pathname.startsWith("/dashboard")) {
    if (!user) return NextResponse.redirect(new URL("/login", request.url));
    if (user.status === "suspended") {
      return NextResponse.redirect(new URL("/suspended", request.url));
    }
    if (user.role === "curator" && user.status !== "approved") {
      return NextResponse.redirect(new URL("/pending", request.url));
    }
    if (!canOpenDashboard(user.role, pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (pathname === "/pending") {
    if (!user) return NextResponse.redirect(new URL("/login", request.url));
    if (user.status === "suspended") {
      return NextResponse.redirect(new URL("/suspended", request.url));
    }
    if (
      user.role !== "curator" ||
      !["pending", "rejected"].includes(user.status)
    ) {
      return NextResponse.redirect(new URL(homeForUser(user), request.url));
    }
  }

  if (pathname === "/suspended") {
    if (!user) return NextResponse.redirect(new URL("/login", request.url));
    if (user.status !== "suspended") {
      return NextResponse.redirect(new URL(homeForUser(user), request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/pending", "/suspended"],
};
