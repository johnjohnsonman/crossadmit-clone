import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "../supabase/types";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
    );
  }
  return createClient<Database>(url, key);
}

export async function recordPipelineRun(params: {
  pipelineType: string;
  status: "success" | "failed" | "partial";
  recordsProcessed: number;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}): Promise<string | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("pipeline_runs")
    .insert({
      pipeline_type: params.pipelineType,
      status: params.status,
      completed_at: new Date().toISOString(),
      records_processed: params.recordsProcessed,
      error_message: params.errorMessage ?? null,
      metadata: (params.metadata ?? {}) as Json,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[pipeline_runs] insert failed:", error.message);
    return null;
  }

  return data?.id ?? null;
}
