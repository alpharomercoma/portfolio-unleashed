import { revalidatePath, revalidateTag } from "next/cache";
import { after } from "next/server";

import { env } from "@/env";
import { type AgentDeps, handleAgentRequest } from "@/lib/agent/http";
import { sendAdminAlert } from "@/lib/notify";
import { agentRateLimit } from "@/lib/ratelimit";

// Bearer-token API for agents to manage site content. All logic (auth,
// guardrails, routing) lives in src/lib/agent; see docs/agent-api.md.
export const dynamic = "force-dynamic";

const deps: AgentDeps = {
	tokens: () => env.AGENT_TOKENS,
	readOnly: () => ["1", "true"].includes(env.AGENT_API_READ_ONLY ?? ""),
	now: () => new Date(),
	rateLimit: agentRateLimit,
	invalidate(tags, paths) {
		// Expire immediately (not stale-while-revalidate), like the resume hook:
		// the next visitor should see the agent's change.
		for (const tag of tags) revalidateTag(tag, { expire: 0 });
		for (const path of paths) revalidatePath(path);
	},
	notify(subject, lines) {
		after(() => sendAdminAlert(subject, lines));
	},
};

type Params = { params: Promise<{ path?: string[] }> };

async function handle(req: Request, { params }: Params) {
	const { path = [] } = await params;
	return handleAgentRequest(req, path, deps);
}

export {
	handle as DELETE,
	handle as GET,
	handle as PATCH,
	handle as POST,
	handle as PUT,
};
