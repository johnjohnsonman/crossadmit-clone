/** Active pipeline_runs_study_korea row for LLM call accounting */
let activePipelineRunId: string | null = null;

export function setActivePipelineRunId(id: string | null) {
  activePipelineRunId = id;
}

export function getActivePipelineRunId(): string | null {
  return activePipelineRunId;
}
