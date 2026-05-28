import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Server-side client: uses the service role key and optionally injects
 * a Clerk JWT so Row Level Security policies can identify the user.
 */
export function createServerClient(supabaseUrl: string, supabaseServiceRoleKey: string) {
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Server-side client authenticated as a specific Clerk user.
 * Pass the JWT from `await currentUser()` / `getAuth()`.
 */
export function createServerClientWithAuth(
  supabaseUrl: string,
  supabaseServiceRoleKey: string,
  clerkToken: string
) {
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    global: {
      headers: {
        Authorization: `Bearer ${clerkToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Browser/React Native client: uses the anon key.
 * RLS is enforced via Clerk JWT passed through Supabase auth.
 */
export function createBrowserClient(supabaseUrl: string, supabaseAnonKey: string) {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}
