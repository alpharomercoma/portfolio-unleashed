import type { Metadata } from "next";

import {
	revertAgentChange,
	toggleAgentFreeze,
} from "@/app/admin/agent-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { env } from "@/env";
import { RESOURCE_NAMES, getAdapter } from "@/lib/agent/resources";
import { getFreeze } from "@/lib/agent/service";
import { AGENT_SCOPES, parseTokenConfig } from "@/lib/agent/tokens";
import { type Actor, readAudit, readHistory } from "@/lib/content/revisions";
import { createRedis } from "@/lib/redis";

export const metadata: Metadata = { title: "Agents", robots: { index: false } };
export const dynamic = "force-dynamic";

const redis = createRedis();

// Token expiry is shown relative to when this (dynamic) page was rendered.
function isExpired(expiresAt: string): boolean {
	return Date.parse(expiresAt) <= Date.now();
}

function who(by: Actor | undefined): string {
	if (!by) return "unknown";
	return by.type === "admin" ? "You (admin)" : `${by.type}: ${by.name}`;
}

function when(iso: string): string {
	const d = new Date(iso);
	return Number.isNaN(d.getTime())
		? iso
		: d.toLocaleString("en-US", {
				dateStyle: "medium",
				timeStyle: "short",
				timeZone: "Asia/Manila",
			});
}

export default async function AgentsPage({
	searchParams,
}: {
	searchParams: Promise<{ saved?: string; error?: string }>;
}) {
	const { saved, error } = await searchParams;
	const config = parseTokenConfig(env.AGENT_TOKENS, RESOURCE_NAMES);
	const [freeze, audit] = redis
		? await Promise.all([getFreeze(), readAudit(redis, 100)])
		: [null, []];
	// Versions actually kept per record, so Revert is offered only where the
	// replaced version exists (a deletion leaves no version to go back to).
	const kept = new Map<string, Set<number>>();
	if (redis) {
		const records = new Set(
			audit.flatMap((e) => {
				const r = e.detail.resource;
				const a = typeof r === "string" ? getAdapter(r) : null;
				if (!a) return [];
				const id = typeof e.detail.id === "string" ? e.detail.id : r;
				return [`${r}\u0000${id}`];
			}),
		);
		await Promise.all(
			[...records].map(async (k) => {
				const [r, id] = k.split("\u0000");
				const history = await readHistory(redis, getAdapter(r)!.recordKey(id));
				kept.set(k, new Set(history.map((h) => h.rev)));
			}),
		);
	}

	return (
		<div className="space-y-12">
			<header>
				<h1 className="display-md">Agents</h1>
				<p className="text-sm text-muted-foreground mt-1 max-w-2xl">
					AI agents edit content through the agent API (
					<code>/api/agent/v1</code>) or <code>pnpm agent</code>. They create
					drafts and hidden items by default; only tokens with the{" "}
					<code>publish</code> scope can change what is live. Every change is
					recorded below and can be reverted.
				</p>
			</header>

			{(saved || error) && (
				<p
					className={`rounded-lg border px-4 py-3 text-sm ${
						error
							? "border-destructive/40 bg-destructive/10 text-destructive"
							: "border-border bg-secondary text-foreground"
					}`}
				>
					{error ??
						(saved === "frozen"
							? "Agent writes are frozen."
							: saved === "unfrozen"
								? "Agent writes are allowed again."
								: saved)}
				</p>
			)}

			<section className="space-y-3">
				<h2 className="text-lg font-semibold">Kill switch</h2>
				{!redis ? (
					<p className="text-sm text-muted-foreground">
						Upstash Redis is not configured, so agents cannot write anyway.
					</p>
				) : freeze ? (
					<form action={toggleAgentFreeze} className="space-y-3">
						<p className="text-sm">
							<strong>Agent writes are frozen</strong> since {when(freeze.at)}
							{freeze.reason ? ` (${freeze.reason})` : ""}. Agents can still
							read.
						</p>
						<input type="hidden" name="freeze" value="false" />
						<Button type="submit">Allow agent writes</Button>
					</form>
				) : (
					<form
						action={toggleAgentFreeze}
						className="flex flex-col sm:flex-row gap-3 sm:items-center max-w-xl"
					>
						<input type="hidden" name="freeze" value="true" />
						<Input
							name="reason"
							placeholder="Reason (optional)"
							maxLength={200}
							aria-label="Reason for freezing"
						/>
						<Button type="submit" variant="destructive">
							Freeze all agent writes
						</Button>
					</form>
				)}
			</section>

			<section className="space-y-3">
				<h2 className="text-lg font-semibold">Tokens</h2>
				{config.state === "unconfigured" ? (
					<p className="text-sm text-muted-foreground">
						The agent API is off. Mint a token with{" "}
						<code>pnpm agent token mint --name NAME --scopes read,write</code>{" "}
						and add its entry to <code>AGENT_TOKENS</code>.
					</p>
				) : config.state === "invalid" ? (
					<p className="text-sm text-destructive">
						<code>AGENT_TOKENS</code> is invalid, so the agent API refuses every
						request: {config.error}
					</p>
				) : (
					<ul className="divide-y divide-border border-y border-border text-sm">
						{config.tokens.map((t) => {
							const expired = t.expiresAt != null && isExpired(t.expiresAt);
							return (
								<li
									key={t.name}
									className="py-3 flex flex-wrap gap-x-6 gap-y-1"
								>
									<span className="font-medium">{t.name}</span>
									<span className="text-muted-foreground">
										{AGENT_SCOPES.filter((s) => t.scopes.has(s)).join(", ")}
									</span>
									<span className="text-muted-foreground">
										{t.resources ? [...t.resources].join(", ") : "all content"}
									</span>
									{t.expiresAt && (
										<span
											className={
												expired ? "text-destructive" : "text-muted-foreground"
											}
										>
											{expired ? "expired" : "expires"} {when(t.expiresAt)}
										</span>
									)}
								</li>
							);
						})}
					</ul>
				)}
			</section>

			<section className="space-y-3">
				<h2 className="text-lg font-semibold">Recent changes</h2>
				{audit.length === 0 ? (
					<p className="text-sm text-muted-foreground">Nothing recorded yet.</p>
				) : (
					<ul className="divide-y divide-border border-y border-border text-sm">
						{audit.map((e, i) => {
							const d = e.detail;
							const resource = typeof d.resource === "string" ? d.resource : "";
							const adapter = getAdapter(resource);
							const id =
								typeof d.id === "string"
									? d.id
									: adapter?.kind === "singleton"
										? resource
										: "";
							const action = typeof d.action === "string" ? d.action : "write";
							const rev = e.revs[0];
							// The version this change replaced. Creates replace nothing,
							// and a reorder spans many records.
							const canRevert =
								adapter &&
								id &&
								e.revs.length === 1 &&
								rev >= 1 &&
								action !== "create" &&
								action !== "reorder" &&
								Boolean(kept.get(`${resource}\u0000${id}`)?.has(rev - 1));
							const changed = Array.isArray(d.changed)
								? (d.changed as string[]).join(", ")
								: "";
							return (
								<li
									key={`${e.at}-${i}`}
									className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
								>
									<div className="min-w-0">
										<div>
											<span className="font-medium">{who(e.by)}</span>{" "}
											<span className="text-muted-foreground">{action}</span>{" "}
											<span className="font-mono text-xs">
												{resource}
												{id && id !== resource ? `/${id}` : ""}
											</span>
											{rev != null && (
												<span className="text-muted-foreground">
													{" "}
													→ rev {rev}
												</span>
											)}
										</div>
										<div className="text-xs text-muted-foreground mt-0.5">
											{when(e.at)}
											{changed && ` · ${changed}`}
											{typeof d.ip === "string" && ` · ${d.ip}`}
										</div>
									</div>
									{canRevert && (
										<form action={revertAgentChange} className="shrink-0">
											<input type="hidden" name="resource" value={resource} />
											<input type="hidden" name="id" value={id} />
											<input type="hidden" name="toRev" value={rev - 1} />
											{/* Only if the record is still at this change's revision. */}
											<input type="hidden" name="fromRev" value={rev} />
											<Button variant="outline" size="sm" type="submit">
												Revert to rev {rev - 1}
											</Button>
										</form>
									)}
								</li>
							);
						})}
					</ul>
				)}
			</section>
		</div>
	);
}
