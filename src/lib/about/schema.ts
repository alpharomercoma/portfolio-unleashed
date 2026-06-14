import { z } from "zod";

// The About page is a single document (a singleton), not a collection.
export const aboutSchema = z.object({
	title: z.string().min(1).max(120),
	body: z.string().max(20000),
	updatedAt: z.string(),
});

export type About = z.infer<typeof aboutSchema>;
