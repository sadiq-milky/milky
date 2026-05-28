import { z } from "zod";

const serverEnvSchema = z.object({
  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Clerk
  CLERK_SECRET_KEY: z.string().min(1),

  // Anthropic
  ANTHROPIC_API_KEY: z.string().min(1),

  // Inngest
  INNGEST_EVENT_KEY: z.string().min(1),
  INNGEST_SIGNING_KEY: z.string().min(1),

  // Langfuse
  LANGFUSE_SECRET_KEY: z.string().min(1),
  LANGFUSE_PUBLIC_KEY: z.string().min(1),
  LANGFUSE_HOST: z.string().url().optional(),

  // PostHog
  POSTHOG_API_KEY: z.string().min(1),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

export function validateServerEnv(env: Record<string, string | undefined>): ServerEnv {
  const result = serverEnvSchema.safeParse(env);
  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Missing or invalid server environment variables: ${missing}`);
  }
  return result.data;
}

export function validateClientEnv(env: Record<string, string | undefined>): ClientEnv {
  const result = clientEnvSchema.safeParse(env);
  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Missing or invalid client environment variables: ${missing}`);
  }
  return result.data;
}

export { serverEnvSchema, clientEnvSchema };
