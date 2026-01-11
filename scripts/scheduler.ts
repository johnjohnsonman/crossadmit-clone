import * as cron from "node-cron";
import { scrapeCrossAdmit, saveScrapedData } from "./scraper";
import { generateAdmissionRecords, saveGeneratedData } from "./dataGenerator";
import { AdmissionRecord } from "@/lib/types";
import fs from "fs";
import path from "path";

// 모든 데이터를 합쳐서 저장하는 함수
async function mergeAndSaveData(
  scraped: AdmissionRecord[],
  generated: AdmissionRecord[]
): Promise<void> {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // 기존 데이터 로드
  const latestPath = path.join(dataDir, "all-admissions.json");
  let existingRecords: AdmissionRecord[] = [];
  
  if (fs.existsSync(latestPath)) {
    try {
      const existingData = fs.readFileSync(latestPath, "utf-8");
      existingRecords = JSON.parse(existingData);
    } catch (error) {
      console.error("Error reading existing data:", error);
    }
  }

  // 새 데이터와 기존 데이터 합치기 (중복 제거)
  const allRecords = [...existingRecords, ...scraped, ...generated];
  const uniqueRecords = Array.from(
    new Map(
      allRecords.map((record) => [
        `${record.university}-${record.major}-${record.year}-${record.status}`,
        record,
      ])
    ).values()
  );

  // 최신순으로 정렬
  uniqueRecords.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // 저장
  fs.writeFileSync(latestPath, JSON.stringify(uniqueRecords, null, 2));
  console.log(`Merged and saved ${uniqueRecords.length} total admission records`);
}

// 매일 실행되는 작업
async function dailyUpdate() {
  console.log(`[${new Date().toISOString()}] Starting daily update...`);
  
  try {
    // 1. 웹에서 데이터 수집
    console.log("Scraping data from crossadmit.com...");
    const scrapedRecords = await scrapeCrossAdmit();
    if (scrapedRecords.length > 0) {
      await saveScrapedData(scrapedRecords);
    }

    // 2. 가상 데이터 생성 (매일 5-10개)
    console.log("Generating virtual data...");
    const generatedCount = Math.floor(Math.random() * 6) + 5; // 5-10개
    const generatedRecords = generateAdmissionRecords(generatedCount);
    await saveGeneratedData(generatedRecords);

    // 3. 데이터 병합 및 저장
    await mergeAndSaveData(scrapedRecords, generatedRecords);
    
    console.log(`[${new Date().toISOString()}] Daily update completed successfully`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Daily update failed:`, error);
  }
}

// 스케줄러 시작
export function startScheduler() {
  // 매일 자정에 실행 (0 0 * * *)
  cron.schedule("0 0 * * *", dailyUpdate, {
    timezone: "Asia/Seoul",
  });

  console.log("Scheduler started. Daily updates will run at midnight (KST).");
  
  // 개발/테스트를 위해 즉시 한 번 실행
  if (process.env.NODE_ENV !== "production") {
    console.log("Running initial update for development...");
    dailyUpdate();
  }
}

// 직접 실행 시
if (require.main === module) {
  startScheduler();
  
  // 프로세스가 종료되지 않도록 유지
  process.on("SIGINT", () => {
    console.log("\nScheduler stopped.");
    process.exit(0);
  });
}


