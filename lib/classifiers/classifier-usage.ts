import { getActivePipelineRunId } from "@/lib/scrapers/run-context";
import { createAdminClient } from "@/lib/supabase/admin";

const DAILY_LIMIT = parseInt(
  process.env.CLASSIFIER_DAILY_LIMIT ?? "500",
  10
);

const PER_RUN_LIMIT = parseInt(
  process.env.CLASSIFIER_PER_RUN_LIMIT ?? "100",
  10
);

const URL_CACHE_MS = 24 * 60 * 60 * 1000;

let runCalls = 0;
let dailyCallsMemory = 0;
let dailyDate = new Date().toISOString().slice(0, 10);
const urlClassifierCache = new Map<string, number>();

function rollDaily() {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== dailyDate) {
    dailyDate = today;
    dailyCallsMemory = 0;
    runCalls = 0;
  }
}

function todayStartIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

async function incrementPipelineRunLlmCalls(runId: string) {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("pipeline_runs_study_korea")
      .select("llm_calls")
      .eq("id", runId)
      .single();

    const next = (data?.llm_calls as number | null) ?? 0;
    await admin
      .from("pipeline_runs_study_korea")
      .update({ llm_calls: next + 1 })
      .eq("id", runId);
  } catch (e) {
    console.error("[classifier] llm_calls increment failed:", e);
  }
}

/** Sum llm_calls from today's pipeline runs (cross-instance) */
export async function getDailyLlmCallsFromDb(): Promise<number> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("pipeline_runs_study_korea")
      .select("llm_calls")
      .gte("created_at", todayStartIso());

    if (error) {
      console.warn("[classifier] daily llm sum failed:", error.message);
      return dailyCallsMemory;
    }
    return (data ?? []).reduce(
      (sum, row) => sum + (Number(row.llm_calls) || 0),
      0
    );
  } catch (e) {
    console.warn("[classifier] daily llm sum error:", e);
    return dailyCallsMemory;
  }
}

export function resetClassifierRunCounter() {
  runCalls = 0;
}

export function isUrlClassifierCached(url: string): boolean {
  const key = url.trim();
  if (!key) return false;
  const ts = urlClassifierCache.get(key);
  if (!ts) return false;
  if (Date.now() - ts > URL_CACHE_MS) {
    urlClassifierCache.delete(key);
    return false;
  }
  return true;
}

export function cacheUrlClassifier(url: string) {
  const key = url.trim();
  if (key) urlClassifierCache.set(key, Date.now());
}

export async function canCallClassifier(): Promise<{
  ok: boolean;
  reason?: string;
  dailyCalls: number;
  runCalls: number;
}> {
  rollDaily();
  const dailyFromDb = await getDailyLlmCallsFromDb();
  const dailyCalls = Math.max(dailyCallsMemory, dailyFromDb);

  if (runCalls >= PER_RUN_LIMIT) {
    return {
      ok: false,
      reason: "per_run_limit",
      dailyCalls,
      runCalls,
    };
  }
  if (dailyCalls >= DAILY_LIMIT) {
    return {
      ok: false,
      reason: "daily_limit",
      dailyCalls,
      runCalls,
    };
  }
  return { ok: true, dailyCalls, runCalls };
}

export async function recordClassifierCall() {
  rollDaily();
  runCalls += 1;
  dailyCallsMemory += 1;

  const runId = getActivePipelineRunId();
  if (runId) {
    await incrementPipelineRunLlmCalls(runId);
  }
}

export async function getClassifierUsageStats() {
  rollDaily();
  const dailyFromDb = await getDailyLlmCallsFromDb();
  const dailyCalls = Math.max(dailyCallsMemory, dailyFromDb);

  return {
    dailyCalls,
    runCalls,
    dailyLimit: DAILY_LIMIT,
    perRunLimit: PER_RUN_LIMIT,
    dailyDate,
  };
}
