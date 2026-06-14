import type { Metadata } from "next";

import { login } from "@/app/admin/actions";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isAuthConfigured } from "@/lib/auth";

export const metadata: Metadata = {
	title: "Admin sign-in",
	robots: { index: false },
};

export default async function LoginPage({
	searchParams,
}: {
	searchParams: Promise<{ error?: string; next?: string }>;
}) {
	const sp = await searchParams;
	return (
		<main className="min-h-screen grid place-items-center bg-background px-4">
			<div className="w-full max-w-sm">
				<div className="flex items-center gap-2 mb-6">
					<Logo size={22} title={null} />
					<span className="font-display text-xl font-semibold tracking-tight">
						Admin
					</span>
				</div>
				<h1 className="display-md mb-2">Manage content</h1>
				<p className="text-sm text-muted-foreground mb-6">
					Sign in to add, edit, and remove talks, certifications, awards, and
					recommendations.
				</p>

				{!isAuthConfigured() && (
					<p className="mb-4 rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground">
						Set <code>ADMIN_PASSWORD</code> and <code>AUTH_SECRET</code> to
						enable sign-in.
					</p>
				)}
				{sp.error === "rate" ? (
					<p className="mb-4 text-sm text-destructive">
						Too many attempts. Try again in a few minutes.
					</p>
				) : sp.error ? (
					<p className="mb-4 text-sm text-destructive">Incorrect password.</p>
				) : null}

				<form action={login} className="space-y-4">
					<input type="hidden" name="next" value={sp.next ?? "/admin"} />
					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							name="password"
							type="password"
							autoFocus
							required
						/>
					</div>
					<Button type="submit" className="w-full">
						Sign in
					</Button>
				</form>
			</div>
		</main>
	);
}
