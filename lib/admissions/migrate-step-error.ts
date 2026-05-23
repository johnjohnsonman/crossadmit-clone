export type MigrateStep =
  | "auth"
  | "load_post"
  | "parse_body"
  | "universities_fetch"
  | "claude_extract"
  | "json_parse"
  | "confidence_check"
  | "admissions_insert"
  | "admission_schools_insert"
  | "study_korea_posts_update"
  | "unknown";

export class MigrateStepError extends Error {
  step: MigrateStep;

  constructor(step: MigrateStep, message: string, cause?: unknown) {
    super(message);
    this.name = "MigrateStepError";
    this.step = step;
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

export function getMigrateStep(err: unknown): MigrateStep {
  if (err instanceof MigrateStepError) return err.step;
  if (err && typeof err === "object" && "step" in err) {
    const s = (err as { step: unknown }).step;
    if (typeof s === "string") return s as MigrateStep;
  }
  return "unknown";
}

export function migrateErrorPayload(err: unknown) {
  const message =
    err instanceof Error ? err.message : String(err ?? "Unknown error");
  const step = getMigrateStep(err);
  const stack =
    err instanceof Error && err.stack
      ? err.stack.split("\n").slice(0, 5).join("\n")
      : undefined;
  return { error: message, step, stack };
}
