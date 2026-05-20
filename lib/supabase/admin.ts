import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * 서버 전용 · Service Role Key 사용 (RLS 우회).
 * 반드시 Route Handler / Server Action 등 서버에서만 호출하세요.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL 및 SUPABASE_SERVICE_ROLE_KEY가 필요합니다."
    );
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
