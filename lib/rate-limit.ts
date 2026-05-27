import { createAdminClient } from "@/lib/supabase/admin";

export async function checkRateLimitBurst(
  ipHash: string,
  action: string,
  maxCount: number,
  windowSeconds: number
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();

  const { count, error } = await supabase
    .from("rate_limit_log")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .eq("action", action)
    .gte("created_at", since);

  if (error) {
    console.warn("[rate-limit] burst check failed:", error.message);
    return { allowed: true };
  }

  if ((count ?? 0) >= maxCount) {
    const { data } = await supabase
      .from("rate_limit_log")
      .select("created_at")
      .eq("ip_hash", ipHash)
      .eq("action", action)
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .limit(1);

    if (data?.[0]) {
      const first = new Date(data[0].created_at as string).getTime();
      const retryAfter = Math.ceil(
        (windowSeconds * 1000 - (Date.now() - first)) / 1000
      );
      return { allowed: false, retryAfter: Math.max(1, retryAfter) };
    }
    return { allowed: false, retryAfter: windowSeconds };
  }

  return { allowed: true };
}

export async function logRateLimitAction(
  ipHash: string,
  action: string
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("rate_limit_log")
    .insert({ ip_hash: ipHash, action });
  if (error) console.warn("[rate-limit] log failed:", error.message);
}

export async function checkRateLimit(
  ipHash: string,
  action: "post" | "comment",
  windowSeconds = 300
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();

  const { data, error } = await supabase
    .from("rate_limit_log")
    .select("created_at")
    .eq("ip_hash", ipHash)
    .eq("action", action)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.warn("[rate-limit] check failed:", error.message);
    return { allowed: true };
  }

  if (data?.length) {
    const lastTime = new Date(data[0]!.created_at as string).getTime();
    const retryAfter = Math.ceil(
      (windowSeconds * 1000 - (Date.now() - lastTime)) / 1000
    );
    return { allowed: false, retryAfter: Math.max(1, retryAfter) };
  }

  return { allowed: true };
}

export async function logRateLimit(
  ipHash: string,
  action: "post" | "comment"
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("rate_limit_log")
    .insert({ ip_hash: ipHash, action });
  if (error) console.warn("[rate-limit] log failed:", error.message);
}
