ALTER TABLE pipeline_runs_study_korea
  ADD COLUMN IF NOT EXISTS llm_calls int DEFAULT 0;
