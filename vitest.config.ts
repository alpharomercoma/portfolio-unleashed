import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src"),
			// Next-only modules: `server-only` throws outside a server bundle, and
			// `next/cache` needs a request scope. Tests get inert stand-ins.
			"server-only": path.resolve(__dirname, "test/stubs/server-only.ts"),
			"next/cache": path.resolve(__dirname, "test/stubs/next-cache.ts"),
		},
	},
	test: {
		environment: "node",
		include: ["test/**/*.test.ts"],
		setupFiles: ["test/setup.ts"],
		// Integration suites share one local Redis and flush it between tests.
		fileParallelism: false,
		testTimeout: 30_000,
	},
});
