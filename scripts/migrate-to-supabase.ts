/**
 * @deprecated MySQL 덤프 마이그레이션은 scripts/migrate-mysql-dump.py 를 사용하세요.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import type { AdmissionRecord } from "../lib/types";
import type { AdmissionsInsert, Database } from "../lib/supabase/types";

const BATCH_SIZE = 100;
const DATA_PATH = path.join(process.cwd(), "data", "all-admissions.json");

function loadEnvLocal(): void {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function toInsertRow(record: AdmissionRecord, numericId: number): AdmissionsInsert {
  const createdAt =
    record.createdAt instanceof Date
      ? record.createdAt.toISOString()
      : new Date(record.createdAt).toISOString();

  return {
    id: numericId,
    original_user_id: 0,
    user_handle: record.username ?? record.studentHandle ?? "익명",
    year: record.year,
    year_end: record.year,
    title: `${record.university} ${record.major}`.trim(),
    input_score: "",
    input_gpa: record.gpa != null ? String(record.gpa) : "",
    input_specialty: record.review ?? "",
    view_count: 0,
    likes_count: record.likes ?? 0,
    is_verified: record.verified ?? false,
    is_featured: record.isFeatured ?? false,
    published: record.published !== false,
    source: record.source ?? "json",
    created_at: createdAt,
  };
}

async function main() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요");
    process.exit(1);
  }

  if (!fs.existsSync(DATA_PATH)) {
    console.error(`데이터 파일 없음: ${DATA_PATH}`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8")) as AdmissionRecord[];
  const supabase = createClient<Database>(url, key);

  let inserted = 0;
  for (let i = 0; i < raw.length; i += BATCH_SIZE) {
    const batch = raw.slice(i, i + BATCH_SIZE);
    const rows = batch.map((r, j) => toInsertRow(r, i + j + 1));
    const { error } = await supabase.from("admissions").upsert(rows, {
      onConflict: "id",
      ignoreDuplicates: true,
    });
    if (error) {
      console.error("batch error:", error.message);
    } else {
      inserted += rows.length;
    }
  }

  console.log(`완료: ${inserted}건 처리 (중복은 무시)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
