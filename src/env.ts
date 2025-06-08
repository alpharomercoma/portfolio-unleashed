import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	server: {
		GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
		EMAIL_SERVER_HOST: z.string().min(1),
		EMAIL_SERVER_PORT: z.string().min(1),
		EMAIL_SERVER_USER: z.string().email().min(1),
		EMAIL_SERVER_PASSWORD: z.string().min(1),
		EMAIL_TARGET: z.string().email().min(1),
		SANITY_API_READ_TOKEN: z.string().min(1),
	},
	client: {
		NEXT_PUBLIC_API_URL: z.string().url().min(1),
		NEXT_PUBLIC_SANITY_STUDIO_PREVIEW_ORIGIN: z.string().url().min(1),
		NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1),
		NEXT_PUBLIC_SANITY_DATASET: z.string().min(1),
		NEXT_PUBLIC_SANITY_API_VERSION: z.string().min(1),
	},
	// If you're using Next.js < 13.4.4, you'll need to specify the runtimeEnv manually
	runtimeEnv: {
		NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
		GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
		EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST,
		EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT,
		EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER,
		EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD,
		EMAIL_TARGET: process.env.EMAIL_TARGET,
		SANITY_API_READ_TOKEN: process.env.SANITY_API_READ_TOKEN,
		NEXT_PUBLIC_SANITY_STUDIO_PREVIEW_ORIGIN:
			process.env.NEXT_PUBLIC_SANITY_STUDIO_PREVIEW_ORIGIN,
		NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
		NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
		NEXT_PUBLIC_SANITY_API_VERSION: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
	},
	emptyStringAsUndefined: true,
});
