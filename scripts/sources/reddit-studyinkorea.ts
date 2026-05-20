/**
 * r/studyinkorea — CLI 래퍼
 *
 * Usage: npm run scrape:studyinkorea
 */
import fs from "fs";
import path from "path";
import { scrapeStudyInKorea } from "../../lib/pipeline/scrape-studyinkorea";

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

async function main() {
  loadEnvLocal();

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("오류: ANTHROPIC_API_KEY가 .env.local에 없습니다.");
    process.exit(1);
  }

  const limit = parseInt(process.env.SCRAPE_LIMIT ?? "25", 10);
  const sort = (process.env.SCRAPE_SORT as "new" | "hot" | "top") || "new";

  try {
    const result = await scrapeStudyInKorea({ limit, sort });
    console.log("\n--- r/studyinkorea 파이프라인 완료 ---");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("파이프라인 실패:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
