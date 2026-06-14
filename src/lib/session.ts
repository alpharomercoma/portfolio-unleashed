import "server-only";

import { cookies } from "next/headers";

import { SESSION_COOKIE, verifySession } from "./auth";

export async function getSession(): Promise<boolean> {
	const token = (await cookies()).get(SESSION_COOKIE)?.value;
	return verifySession(token);
}
