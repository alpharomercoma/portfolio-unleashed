import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	server: {
		GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
		TARGET_EMAIL: z.string().email().min(1),
		OAUTH_CLIENT_ID: z.string().min(1),
		OAUTH_CLIENT_SECRET: z.string().min(1),
		OAUTH_REFRESH_TOKEN: z.string().min(1),
		USER_EMAIL: z.string().email().min(1),
	},
	client: {
		NEXT_PUBLIC_API_URL: z.string().url().min(1),
	},
	// If you're using Next.js < 13.4.4, you'll need to specify the runtimeEnv manually
	runtimeEnv: {
		GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
		TARGET_EMAIL: process.env.TARGET_EMAIL,
		OAUTH_CLIENT_ID: process.env.OAUTH_CLIENT_ID,
		OAUTH_CLIENT_SECRET: process.env.OAUTH_CLIENT_SECRET,
		OAUTH_REFRESH_TOKEN: process.env.OAUTH_REFRESH_TOKEN,
		NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
		USER_EMAIL: process.env.USER_EMAIL,
	},
	emptyStringAsUndefined: true,
});
