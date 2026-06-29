import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

// Flat config for ESLint 9 / Next.js 16 (`next lint` was removed in v16).
// Run with `pnpm lint` (= `eslint .`). Core Web Vitals rules are errors;
// typescript-eslint recommended is layered on top; `prettier` last so it
// disables formatting rules that would fight Prettier.
const eslintConfig = defineConfig([
	...nextVitals,
	...nextTs,
	prettier,
	globalIgnores([
		// eslint-config-next defaults.
		".next/**",
		"out/**",
		"build/**",
		"next-env.d.ts",
		// Generated, not hand-written: Sanity types and the Serwist worker bundle.
		"sanity.types.ts",
		"public/sw.js",
		"public/swe-worker-*.js",
	]),
]);

export default eslintConfig;
