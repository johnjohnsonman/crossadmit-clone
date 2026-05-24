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
let dailyCalls = 0;
let dailyDate = new Date().toISOString().slice(0, 10);
const urlClassifierCache = new Map<string, number>();

function rollDaily() {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== dailyDate) {
    dailyDate = today;
    dailyCalls = 0;
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

export function canCallClassifier(): {
  ok: boolean;
  reason?: string;
  dailyCalls: number;
  runCalls: number;
} {
  rollDaily();
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

export function recordClassifierCall() {
  rollDaily();
  runCalls += 1;
  dailyCalls += 1;
}

export function getClassifierUsageStats() {
  rollDaily();
  return {
    dailyCalls,
    runCalls,
    dailyLimit: DAILY_LIMIT,
    perRunLimit: PER_RUN_LIMIT,
    dailyDate,
  };
}
