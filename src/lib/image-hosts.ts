// Remote hosts next/image may optimize. next.config.ts builds `remotePatterns`
// from this list, and the agent API only accepts remote image URLs whose host
// matches it: a host outside this list makes next/image throw at render time,
// which would take the whole page down.
export const REMOTE_IMAGE_HOSTS = [
	"cdn.sanity.io",
	"*.public.blob.vercel-storage.com",
] as const;

/** True when `hostname` matches an entry ("*." matches exactly one label). */
export function isAllowedImageHost(hostname: string): boolean {
	const host = hostname.toLowerCase();
	return REMOTE_IMAGE_HOSTS.some((pattern) => {
		if (!pattern.startsWith("*.")) return host === pattern;
		const suffix = pattern.slice(1); // ".public.blob.vercel-storage.com"
		if (!host.endsWith(suffix)) return false;
		const label = host.slice(0, -suffix.length);
		return /^[a-z0-9-]+$/.test(label);
	});
}
