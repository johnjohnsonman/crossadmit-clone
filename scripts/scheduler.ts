// DEPRECATED: Vercel Cron으로 마이그레이션 예정
import * as cron from "node-cron";
import { scrapeCrossAdmit, saveScrapedData } from "./scraper";
import { AdmissionRecord } from "@/lib/types";
import fs from "fs";
import path from "path";

async function mergeAndSaveData(scraped: AdmissionRecord[]): Promise<void> {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

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

  const allRecords = [...existingRecords, ...scraped];
  const uniqueRecords = Array.from(
    new Map(
      allRecords.map((record) => [
        `${record.university}-${record.major}-${record.year}-${record.status}`,
        record,
      ])
    ).values()
  );

  uniqueRecords.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  fs.writeFileSync(latestPath, JSON.stringify(uniqueRecords, null, 2));
  console.log(
    `Merged and saved ${uniqueRecords.length} total admission records`
  );
}

async function dailyUpdate() {
  console.log(`[${new Date().toISOString()}] Starting daily update...`);

  try {
    console.log("Scraping data from crossadmit.com...");
    const scrapedRecords = await scrapeCrossAdmit();
    if (scrapedRecords.length > 0) {
      await saveScrapedData(scrapedRecords);
    }

    await mergeAndSaveData(scrapedRecords);

    console.log(
      `[${new Date().toISOString()}] Daily update completed successfully`
    );
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Daily update failed:`, error);
  }
}

export function startScheduler() {
  cron.schedule("0 0 * * *", dailyUpdate, {
    timezone: "Asia/Seoul",
  });

  console.log("Scheduler started. Daily updates will run at midnight (KST).");

  if (process.env.NODE_ENV !== "production") {
    console.log("Running initial update for development...");
    dailyUpdate();
  }
}

if (require.main === module) {
  startScheduler();

  process.on("SIGINT", () => {
    console.log("\nScheduler stopped.");
    process.exit(0);
  });
}
