import { scrapeCrossAdmitData, saveScrapedData } from "./crossadmitScraper";
import { AdmissionRecord } from "../lib/types";

export async function scrapeCrossAdmit(): Promise<AdmissionRecord[]> {
  return await scrapeCrossAdmitData();
}

export { saveScrapedData } from "./crossadmitScraper";

// 직접 실행 시
if (require.main === module) {
  scrapeCrossAdmit()
    .then((records) => {
      saveScrapedData(records);
      console.log(`Total records scraped: ${records.length}`);
    })
    .catch((error) => {
      console.error("Scraping failed:", error);
      process.exit(1);
    });
}

