import "server-only";

import { createMistral } from "@ai-sdk/mistral";
import { generateObject, generateText } from "ai";

import { DRAFT_PROMPT, type TalkDraft, draftSchema } from "./draft-schema";

// A provider that turns a public PDF URL into a structured talk draft. Swapping
// or adding providers (e.g. a Gemini drafter via @ai-sdk/google) is additive:
// implement this and register it in `DRAFTERS` below. The SSRF-guarded URL
// resolution lives in ai-draft.ts and is provider-agnostic.
export interface TalkDrafter {
	readonly id: string;
	draft(pdfUrl: string): Promise<TalkDraft>;
}

function stripCodeFence(text: string): string {
	return text
		.trim()
		.replace(/^```(?:json)?\s*/i, "")
		.replace(/\s*```$/i, "")
		.trim();
}

function createMistralDrafter(): TalkDrafter {
	return {
		id: "mistral",
		async draft(pdfUrl) {
			const apiKey = process.env.MISTRAL_API_KEY;
			if (!apiKey) {
				throw new Error(
					"AI drafting isn't configured (missing MISTRAL_API_KEY).",
				);
			}
			const mistral = createMistral({ apiKey });
			// Configurable so the model can be swapped without a code change. The
			// default supports PDF document understanding.
			const model = mistral(
				process.env.MISTRAL_MODEL_ID || "mistral-small-latest",
			);
			// Mistral fetches the PDF itself from this URL (document understanding).
			const content = [
				{ type: "text" as const, text: DRAFT_PROMPT },
				{
					type: "file" as const,
					data: new URL(pdfUrl),
					mediaType: "application/pdf",
				},
			];
			const providerOptions = { mistral: { documentPageLimit: 80 } };

			try {
				const { object } = await generateObject({
					model,
					schema: draftSchema,
					messages: [{ role: "user", content }],
					providerOptions,
				});
				return object;
			} catch {
				// Some Mistral document models reject json_schema structured mode; fall
				// back to free-text JSON and validate it ourselves.
				const { text } = await generateText({
					model,
					messages: [
						{
							role: "user",
							content: [
								{
									type: "text" as const,
									text: `${DRAFT_PROMPT}\n\nReturn ONLY a JSON object with keys: title, tagline, abstract, outline (string[]), keyTakeaways (string[]), tags (string[]), category, type, level (string or null). No prose, no code fence.`,
								},
								content[1],
							],
						},
					],
					providerOptions,
				});
				let parsed: unknown;
				try {
					parsed = JSON.parse(stripCodeFence(text));
				} catch {
					throw new Error(
						"The AI response couldn't be read. Please try again.",
					);
				}
				// Validate without leaking the raw model output in a ZodError message.
				const result = draftSchema.safeParse(parsed);
				if (!result.success) {
					throw new Error(
						"The AI response couldn't be read. Please try again.",
					);
				}
				return result.data;
			}
		},
	};
}

const DRAFTERS: Record<string, () => TalkDrafter> = {
	mistral: createMistralDrafter,
};

/** The configured drafter (TALK_DRAFTER env, default "mistral"). */
export function getDrafter(): TalkDrafter {
	const id = process.env.TALK_DRAFTER || "mistral";
	return (DRAFTERS[id] ?? DRAFTERS.mistral)();
}
