import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE, verifySession } from "@/lib/auth";

// Protect /admin/* (except the login page). Unauthenticated requests are
// redirected to the login page with a ?next back-link.
export async function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;
	if (pathname === "/admin/login") return NextResponse.next();

	const token = req.cookies.get(SESSION_COOKIE)?.value;
	if (await verifySession(token)) return NextResponse.next();

	const url = req.nextUrl.clone();
	url.pathname = "/admin/login";
	url.searchParams.set("next", pathname);
	return NextResponse.redirect(url);
}

export const config = {
	matcher: ["/admin", "/admin/:path*"],
};
