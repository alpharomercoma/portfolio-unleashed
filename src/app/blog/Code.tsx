import { codeToHtml, splitLines } from "shiki";
import ClickToCopy from "./ClickToCopy";
import { CODE_COLOR_REPLACEMENTS } from "./code-colors";
import css from "./Code.module.css";
import { cn } from "@/lib/utils";
import { stegaClean } from "next-sanity";

export default async function Code({
	value,
}: {
	value?: {
		language: string;
		code: string;
		filename?: string;
		highlightedLines?: number[];
	};
}) {
	if (!value?.code) return null;

	const html = await codeToHtml(stegaClean(value.code), {
		// ANSI output brings its own colours, which no theme setting can keep readable.
		lang: value.language === "ansi" ? "text" : value.language,
		theme: "dark-plus",
		colorReplacements: CODE_COLOR_REPLACEMENTS,
		decorations: value.highlightedLines
			?.map((row) => ({
				row,
				characters: stegaClean(splitLines(value.code)[row - 1]?.[0])?.length,
			}))
			?.filter(({ characters }) => characters > 0)
			?.map(({ row, characters }) => ({
				start: { line: row - 1, character: 0 },
				end: { line: row - 1, character: characters },
				properties: { class: "highlight" },
			})),
	});

	return (
		<article className="relative !mb-2 !mt-6">
			{value.filename && (
				<div className="rounded-t-xl border-b border-white/25 bg-ink px-4 py-2.5 font-mono text-xs text-white">
					{value.filename}
				</div>
			)}

			<div className="relative">
				<div className={css.code} dangerouslySetInnerHTML={{ __html: html }} />

				<ClickToCopy
					value={stegaClean(value.code)}
					className={cn(
						"absolute right-0 top-0 m-1 inline-flex size-9 items-center justify-center rounded text-lg text-white [--focus:#ffffff]",
						"hover:bg-white/10 active:bg-white/20",
					)}
				/>
			</div>
		</article>
	);
}
