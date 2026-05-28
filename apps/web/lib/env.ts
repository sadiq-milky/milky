import { validateServerEnv } from "@milky/config";

// Validated at module load time — app will not start with missing env vars.
export const env = validateServerEnv(process.env as Record<string, string | undefined>);
