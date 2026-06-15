"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import {
	SESSION_COOKIE,
	SESSION_MAX_AGE,
	checkPassword,
	signSession,
} from "@/lib/auth";
import { sendAdminAlert } from "@/lib/notify";
import { loginRateLimit } from "@/lib/ratelimit";
import { SITE_DOMAIN } from "@/lib/seo";

export async function login(formData: FormData) {
	const password = String(formData.get("password") ?? "");
	const next = String(formData.get("next") ?? "/admin");
	const safeNext = next.startsWith("/admin") ? next : "/admin";

	const h = await headers();
	const ip =
		(h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "anonymous";
	const ua = h.get("user-agent") ?? "unknown";

	// Brute-force protection: block the IP after too many attempts.
	const { success } = await loginRateLimit(ip);
	if (!success) {
		await sendAdminAlert(`Blocked sign-in attempts on ${SITE_DOMAIN}`, [
			"Admin sign-in attempts were rate-limited (possible brute force).",
			`IP: ${ip}`,
			`User-Agent: ${ua}`,
			`Time: ${new Date().toISOString()}`,
		]);
		redirect(`/admin/login?error=rate&next=${encodeURIComponent(safeNext)}`);
	}

	if (!checkPassword(password)) {
		redirect(`/admin/login?error=1&next=${encodeURIComponent(safeNext)}`);
	}

	const token = await signSession();
	(await cookies()).set(SESSION_COOKIE, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: SESSION_MAX_AGE,
	});

	await sendAdminAlert(`Admin sign-in to ${SITE_DOMAIN}`, [
		"A successful admin sign-in just occurred.",
		`IP: ${ip}`,
		`User-Agent: ${ua}`,
		`Time: ${new Date().toISOString()}`,
	]);

	redirect(safeNext);
}

export async function logout() {
	(await cookies()).delete(SESSION_COOKIE);
	redirect("/admin/login");
}
