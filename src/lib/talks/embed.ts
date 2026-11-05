// Build an embeddable URL for Canva / Google Slides decks. The host is matched
// exactly (not by substring), so a URL like https://evil.example/?canva.com/design
// can never become an iframe on this page.
export function toEmbedUrl(url: string): string | null {
	let u: URL;
	try {
		u = new URL(url);
	} catch {
		return null;
	}
	if (u.protocol !== "https:" || u.username || u.password) return null;
	if (
		(u.hostname === "www.canva.com" || u.hostname === "canva.com") &&
		u.pathname.startsWith("/design/")
	) {
		return `${u.origin}${u.pathname}${u.search ? `${u.search}&` : "?"}embed`;
	}
	if (
		u.hostname === "docs.google.com" &&
		u.pathname.startsWith("/presentation/")
	) {
		u.pathname = u.pathname.replace(/\/(edit|view|pub).*$/, "/embed");
		u.search = "";
		u.hash = "";
		return u.toString();
	}
	return null;
}
