import { createClient } from "@supabase/supabase-js";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase admin env vars missing");
  }
  return createClient(url, key);
}

export async function startPipelineRun(source: string, query = "") {
  const supabase = admin();
  const { data, error } = await supabase
    .from("pipeline_runs_study_korea")
    .insert({
      source,
      query,
      status: "running",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function finishPipelineRun(
  id: string,
  result: {
    collected: number;
    processed: number;
    saved: number;
    failed: number;
    status: "success" | "partial" | "failed";
    error_message?: string;
  }
) {
  const supabase = admin();
  await supabase
    .from("pipeline_runs_study_korea")
    .update({
      collected: result.collected,
      processed: result.processed,
      saved: result.saved,
      failed: result.failed,
      status: result.status,
      error_message: result.error_message ?? "",
    })
    .eq("id", id);
}
