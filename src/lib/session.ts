import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE, verifySession } from "./auth";

export async function getSession(): Promise<boolean> {
	const token = (await cookies()).get(SESSION_COOKIE)?.value;
	return verifySession(token);
}

/**
 * Admin-only gate for server actions: redirect to the login page when the
 * request isn't authenticated. (API routes return 401 instead, so they keep
 * their own getSession() check.)
 */
export async function requireAdmin(): Promise<void> {
	if (!(await getSession())) redirect("/admin/login");
}
