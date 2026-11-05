import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Renders trusted (admin-authored) markdown. react-markdown does not render raw
// HTML by default, so this is XSS-safe. Styled to match the site's type system
// without relying on a typography plugin.
export function Markdown({ children }: { children: string }) {
	return (
		<div className="space-y-6 text-lg leading-[1.75]">
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				components={{
					h1: ({ children }) => (
						<h2 className="display-md mb-2 mt-12">{children}</h2>
					),
					h2: ({ children }) => (
						<h2 className="display-md mb-2 mt-10">{children}</h2>
					),
					h3: ({ children }) => (
						<h3 className="display-sm mb-2 mt-8">{children}</h3>
					),
					p: ({ children }) => <p>{children}</p>,
					a: ({ href, children }) => (
						<a
							href={href}
							target={href?.startsWith("http") ? "_blank" : undefined}
							rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
							className="text-link"
						>
							{children}
						</a>
					),
					strong: ({ children }) => (
						<strong className="font-semibold">{children}</strong>
					),
					ul: ({ children }) => (
						<ul className="list-disc pl-6 space-y-2 marker:text-brand">
							{children}
						</ul>
					),
					ol: ({ children }) => (
						<ol className="list-decimal pl-6 space-y-2 marker:text-muted-foreground">
							{children}
						</ol>
					),
					blockquote: ({ children }) => (
						<blockquote className="border-l-2 border-brand pl-5 text-muted-foreground">
							{children}
						</blockquote>
					),
					code: ({ children }) => (
						<code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[0.85em]">
							{children}
						</code>
					),
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					img: ({ src, alt }: any) => (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							src={typeof src === "string" ? src : ""}
							alt={alt ?? ""}
							loading="lazy"
							className="w-full rounded-2xl border border-border bg-secondary"
						/>
					),
					hr: () => <hr className="border-border" />,
				}}
			>
				{children}
			</ReactMarkdown>
		</div>
	);
}
