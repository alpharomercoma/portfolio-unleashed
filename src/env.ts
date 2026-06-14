import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	// All optional: the site must build and run without blog credentials.
	// Features that need a given value degrade gracefully when it is absent.
	server: {
		SANITY_API_READ_TOKEN: z.string().min(1).optional(),
		// Talks store (Upstash Redis) + media (Vercel Blob) + admin auth.
		UPSTASH_REDIS_REST_URL: z.string().url().optional(),
		UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
		BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
		ADMIN_PASSWORD: z.string().min(1).optional(),
		AUTH_SECRET: z.string().min(1).optional(),
	},
	client: {
		NEXT_PUBLIC_API_URL: z.string().url().min(1).optional(),
		NEXT_PUBLIC_SANITY_STUDIO_PREVIEW_ORIGIN: z
			.string()
			.url()
			.min(1)
			.optional(),
		NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1).optional(),
		NEXT_PUBLIC_SANITY_DATASET: z.string().min(1).optional(),
		NEXT_PUBLIC_SANITY_API_VERSION: z.string().min(1).optional(),
	},
	// If you're using Next.js < 13.4.4, you'll need to specify the runtimeEnv manually
	runtimeEnv: {
		NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
		SANITY_API_READ_TOKEN: process.env.SANITY_API_READ_TOKEN,
		UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
		UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
		BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
		ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
		AUTH_SECRET: process.env.AUTH_SECRET,
		NEXT_PUBLIC_SANITY_STUDIO_PREVIEW_ORIGIN:
			process.env.NEXT_PUBLIC_SANITY_STUDIO_PREVIEW_ORIGIN,
		NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
		NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
		NEXT_PUBLIC_SANITY_API_VERSION: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
	},
	emptyStringAsUndefined: true,
});
