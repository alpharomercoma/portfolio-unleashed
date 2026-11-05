// dark-plus is built for a grey editor. On the site's ink block, and on the faint
// band behind a highlighted line, these tokens fall under 4.5:1, so each is lifted
// to a lighter colour in the same family. test/unit/contrast.test.ts checks the
// whole theme against both backgrounds.
export const CODE_COLOR_REPLACEMENTS: Record<string, string> = {
	"#000080": "#9cdcfe",
	"#646695": "#a8a8c8",
	"#808080": "#9a9ab0",
	"#d16969": "#e08c8c",
	"#f44747": "#ff8080",
};
