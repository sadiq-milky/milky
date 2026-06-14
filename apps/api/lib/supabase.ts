import { createServerClient } from "@milky/db";
import { env } from "./env";

export const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
