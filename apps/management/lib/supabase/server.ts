import { createClient } from "@supabase/supabase-js";

function readEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getSupabaseAdminClient() {
  const rawUrl = readEnv("SUPABASE_URL");
  const normalizedBase = rawUrl.replace(/\/rest\/v1\/?$/, "");
  const url = normalizedBase.endsWith("/") ? normalizedBase.slice(0, -1) : normalizedBase;
  const serviceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
