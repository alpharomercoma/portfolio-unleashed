import type { Metadata } from "next";
import { toPlainText, type PortableTextBlock } from "next-sanity";
import { VisualEditing } from "next-sanity/visual-editing";
import { draftMode } from "next/headers";
import { preconnect } from "react-dom";

import { SiteShell } from "@/components/site-shell";
import { SITE_URL } from "@/lib/seo";
import * as demo from "@/sanity/lib/demo";
import { sanityFetch } from "@/sanity/lib/fetch";
import { settingsQuery } from "@/sanity/lib/queries";
import { resolveOpenGraphImage } from "@/sanity/lib/utils";
import AlertBanner from "./alert-banner";
import PortableText from "./portable-text";

export async function generateMetadata(): Promise<Metadata> {
	const settings = await sanityFetch({
		query: settingsQuery,
		// Metadata should never contain stega
		stega: false,
	});
	const title = settings?.title || demo.title;
	const description = settings?.description || demo.description;

	const ogImage = resolveOpenGraphImage(settings?.ogImage);
	let metadataBase = new URL(SITE_URL);
	try {
		if (settings?.ogImage?.metadataBase) {
			metadataBase = new URL(settings.ogImage.metadataBase);
		}
	} catch {
		// ignore, keep the site default
	}
	return {
		metadataBase,
		title: {
			template: `%s | ${title}`,
			default: title,
		},
		description: toPlainText(description),
		openGraph: {
			images: ogImage ? [ogImage] : [],
		},
	};
}

export default async function BlogLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// Every cover image on these pages comes from here.
	preconnect("https://cdn.sanity.io");
	const data = await sanityFetch({ query: settingsQuery });
	const footer = data?.footer || [];
	const { isEnabled: isDraftMode } = await draftMode();

	return (
		<SiteShell>
			{isDraftMode && <AlertBanner />}
			{children}
			{footer.length > 0 && (
				<div className="site-container border-t border-border py-10">
					<PortableText
						className="measure text-sm text-muted-foreground"
						value={footer as PortableTextBlock[]}
					/>
				</div>
			)}
			{isDraftMode && <VisualEditing />}
		</SiteShell>
	);
}
