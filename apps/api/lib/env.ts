import { z } from "zod";

const serverEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1),
});

const result = serverEnvSchema.safeParse(process.env);
if (!result.success) {
  const missing = result.error.issues.map((i) => i.path.join(".")).join(", ");
  throw new Error(`Missing environment variables: ${missing}`);
}

export const env = result.data;
