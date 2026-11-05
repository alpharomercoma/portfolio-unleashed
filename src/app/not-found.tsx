import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
	title: "Page not found | Alpha Romer Coma",
	robots: { index: false },
};

export default function NotFound() {
	return (
		<SiteShell>
			<PageHeader title="Nothing at this address.">
				The link may be old or mistyped. Every page on the site can be reached
				from the bar above.
			</PageHeader>
			<div className="site-container mt-8 pb-16 lg:pb-24">
				<Button asChild size="lg">
					<Link href="/">Go to the home page</Link>
				</Button>
			</div>
		</SiteShell>
	);
}
