"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { getAdapter } from "@/lib/agent/resources";
import { AgentError, adminRevert, setFreeze } from "@/lib/agent/service";
import { createLogger } from "@/lib/logger";
import { requireAdmin } from "@/lib/session";

const log = createLogger("agents");

const back = (params: Record<string, string>) =>
	redirect(`/admin/agents?${new URLSearchParams(params)}`);

// Freeze or unfreeze every agent write at once (the kill switch).
export async function toggleAgentFreeze(formData: FormData) {
	await requireAdmin();
	const freeze = formData.get("freeze") === "true";
	const reason = String(formData.get("reason") ?? "").trim();
	await setFreeze(freeze, { type: "admin" }, reason);
	revalidatePath("/admin/agents");
	back({ saved: freeze ? "frozen" : "unfrozen" });
}

// Restore a record to the version before an agent's change.
export async function revertAgentChange(formData: FormData) {
	await requireAdmin();
	const resource = String(formData.get("resource") ?? "");
	const id = String(formData.get("id") ?? "");
	const toRev = Number(formData.get("toRev"));
	const fromRev = Number(formData.get("fromRev"));
	const adapter = getAdapter(resource);
	if (
		!adapter ||
		!Number.isSafeInteger(toRev) ||
		toRev < 0 ||
		!Number.isSafeInteger(fromRev)
	) {
		back({ error: "That change can't be reverted." });
	}
	let message: string;
	try {
		const res = await adminRevert(resource, id, toRev, fromRev);
		const { tags, paths } = adapter!.invalidations(
			adapter!.kind === "singleton" ? undefined : id,
		);
		for (const tag of tags) updateTag(tag);
		for (const path of paths) revalidatePath(path);
		message = res.unchanged
			? `${resource}/${id} already matches version ${toRev}.`
			: `Restored ${resource}/${id} to version ${toRev} (now revision ${res.rev}).`;
	} catch (err) {
		if (!(err instanceof AgentError)) log.error("revert failed", err);
		back({
			error:
				err instanceof AgentError
					? err.message
					: "Couldn't revert. Please try again.",
		});
	}
	revalidatePath("/admin/agents");
	back({ saved: message! });
}
