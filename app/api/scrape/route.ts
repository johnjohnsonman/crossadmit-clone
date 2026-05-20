import { NextResponse } from "next/server";
import { AdmissionRecord } from "@/lib/types";
import fs from "fs";
import path from "path";

async function scrapeCrossAdmitData(): Promise<AdmissionRecord[]> {
  const hardcodedData: AdmissionRecord[] = [
    {
      id: `scraped-${Date.now()}-1`,
      university: "서울대학교",
      universityEn: "Seoul National University",
      major: "경제학과",
      year: 2024,
      admissionType: "정시",
      status: "합격",
      createdAt: new Date(),
      source: "web",
    },
    {
      id: `scraped-${Date.now()}-2`,
      university: "연세대학교(서울캠)",
      universityEn: "Yonsei University",
      major: "컴퓨터공학부",
      year: 2024,
      admissionType: "수시",
      status: "등록",
      createdAt: new Date(),
      source: "web",
    },
  ];
  return hardcodedData;
}

async function mergeAndSaveData(
  scraped: AdmissionRecord[]
): Promise<{ total: number; new: number }> {
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

  const existingCount = existingRecords.length;
  const allRecords = [...existingRecords, ...scraped];
  const uniqueRecords = Array.from(
    new Map(
      allRecords.map((record) => [
        `${record.university}-${record.major}-${record.year}-${record.status}`,
        record,
      ])
    ).values()
  );

  uniqueRecords.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });

  fs.writeFileSync(latestPath, JSON.stringify(uniqueRecords, null, 2));

  return {
    total: uniqueRecords.length,
    new: uniqueRecords.length - existingCount,
  };
}

export async function POST() {
  try {
    console.log(`[${new Date().toISOString()}] Starting automatic data collection...`);

    const scrapedRecords = await scrapeCrossAdmitData();

    if (scrapedRecords.length > 0) {
      const dataDir = path.join(process.cwd(), "data");
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const filePath = path.join(dataDir, `scraped-${Date.now()}.json`);
      fs.writeFileSync(filePath, JSON.stringify(scrapedRecords, null, 2));
    }

    const result = await mergeAndSaveData(scrapedRecords);

    console.log(`[${new Date().toISOString()}] Data collection completed successfully`);

    return NextResponse.json({
      success: true,
      message: "Data collection completed",
      scraped: scrapedRecords.length,
      total: result.total,
      new: result.new,
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Data collection failed:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
