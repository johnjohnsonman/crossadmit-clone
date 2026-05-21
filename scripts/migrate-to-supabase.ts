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

function toInsertRow(record: AdmissionRecord): AdmissionsInsert {
  const createdAt =
    record.createdAt instanceof Date
      ? record.createdAt.toISOString()
      : new Date(record.createdAt).toISOString();

  return {
    id: record.id,
    university: record.university,
    university_en: record.universityEn,
    major: record.major,
    year: record.year,
    admission_type: record.admissionType,
    status: record.status,
    created_at: createdAt,
    source: record.source,
    nationality: (record as AdmissionRecord & { nationality?: string }).nationality ?? null,
    username: record.username ?? null,
    test_scores: record.testScores ?? null,
    gpa: record.gpa ?? null,
    special_skills: record.specialSkills ?? null,
    review: record.review ?? null,
    likes: record.likes ?? 0,
    comments: record.comments ?? null,
  };
}

async function main() {
  loadEnvLocal();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "오류: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY가 .env.local에 설정되어 있어야 합니다."
    );
    process.exit(1);
  }

  if (!fs.existsSync(DATA_PATH)) {
    console.error(
      `오류: ${DATA_PATH} 파일이 없습니다.\n먼저 스크래핑을 실행하거나 기존 데이터 파일을 data/ 폴더에 배치하세요.`
    );
    process.exit(1);
  }

  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  const allRecords: AdmissionRecord[] = JSON.parse(raw);

  const records = allRecords.filter((r) => r.source !== "generated");
  const skipped = allRecords.length - records.length;

  console.log(`전체 레코드: ${allRecords.length}`);
  console.log(`제외 (source=generated): ${skipped}`);
  console.log(`마이그레이션 대상: ${records.length}`);

  if (records.length === 0) {
    console.log("마이그레이션할 레코드가 없습니다.");
    process.exit(0);
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey);

  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const rows = batch.map(toInsertRow);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(records.length / BATCH_SIZE);

    const { error } = await supabase.from("admissions").upsert(rows, {
      onConflict: "id",
    });

    if (error) {
      console.error(`배치 ${batchNum}/${totalBatches} 실패:`, error.message);
      failed += batch.length;
    } else {
      inserted += batch.length;
      console.log(
        `배치 ${batchNum}/${totalBatches} 완료 (${inserted}/${records.length})`
      );
    }
  }

  console.log("\n--- 마이그레이션 완료 ---");
  console.log(`성공: ${inserted}`);
  console.log(`실패: ${failed}`);
  console.log(`제외 (generated): ${skipped}`);
}

main().catch((err) => {
  console.error("마이그레이션 중 오류:", err);
  process.exit(1);
});
