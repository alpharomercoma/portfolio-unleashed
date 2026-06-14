import { SignJWT, jwtVerify } from "jose";

// Edge-safe single-admin auth: a password is verified once, then a signed JWT is
// stored in an HTTP-only cookie. No node:crypto so this module is safe to import
// from middleware (edge runtime).

export const SESSION_COOKIE = "alpha_admin";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secretKey(): Uint8Array {
	return new TextEncoder().encode(process.env.AUTH_SECRET ?? "");
}

export function isAuthConfigured(): boolean {
	return Boolean(process.env.ADMIN_PASSWORD && process.env.AUTH_SECRET);
}

export async function signSession(): Promise<string> {
	return new SignJWT({ admin: true })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("7d")
		.sign(secretKey());
}

export async function verifySession(
	token: string | undefined | null,
): Promise<boolean> {
	if (!token || !process.env.AUTH_SECRET) return false;
	try {
		const { payload } = await jwtVerify(token, secretKey());
		return payload.admin === true;
	} catch {
		return false;
	}
}

/** Constant-time-ish password comparison (no node:crypto, edge-safe). */
export function checkPassword(input: string): boolean {
	const expected = process.env.ADMIN_PASSWORD ?? "";
	if (!expected || input.length !== expected.length) return false;
	let diff = 0;
	for (let i = 0; i < expected.length; i++) {
		diff |= input.charCodeAt(i) ^ expected.charCodeAt(i);
	}
	return diff === 0;
}
