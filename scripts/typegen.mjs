// Regenerates Sanity TypeScript types from the schema, but ONLY when blog
// credentials are present. `sanity schema extract` authenticates against the
// Sanity API, so it can't run without a real project id. The generated files
// (sanity.types.ts, schema.json) are committed to git, so credential-less
// builds reuse them instead of hitting the network.
import { spawnSync } from "node:child_process";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

if (!projectId || projectId === "placeholder") {
	console.log(
		"[typegen] No NEXT_PUBLIC_SANITY_PROJECT_ID set; skipping Sanity type generation and using committed sanity.types.ts.",
	);
	process.exit(0);
}

for (const args of [
	["schema", "extract"],
	["typegen", "generate"],
]) {
	const result = spawnSync("sanity", args, { stdio: "inherit", shell: true });
	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}
