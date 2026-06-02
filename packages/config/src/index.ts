import { z } from "zod";

const serverEnvSchema = z.object({
  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Clerk
  CLERK_SECRET_KEY: z.string().min(1),

  // Anthropic
  ANTHROPIC_API_KEY: z.string().min(1),

  // Inngest — optional until background jobs are wired in
  INNGEST_EVENT_KEY: z.string().min(1).optional(),
  INNGEST_SIGNING_KEY: z.string().min(1).optional(),

  // Langfuse — optional until LLM observability is wired in
  LANGFUSE_SECRET_KEY: z.string().min(1).optional(),
  LANGFUSE_PUBLIC_KEY: z.string().min(1).optional(),
  LANGFUSE_HOST: z.string().url().optional(),

  // PostHog — optional until analytics is wired in
  POSTHOG_API_KEY: z.string().min(1).optional(),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),

  // PostHog — optional until analytics is wired in
  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
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
