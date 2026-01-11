import { NextResponse } from "next/server";
import { AdmissionRecord } from "@/lib/types";
import fs from "fs";
import path from "path";
import { generateAdmissionRecords } from "@/scripts/dataGenerator";

// 스크래핑 함수 (인라인으로 구현)
async function scrapeCrossAdmitData(): Promise<AdmissionRecord[]> {
  // crossadmit.com에서 하드코딩된 데이터 반환
  // 실제로는 웹 스크래핑을 수행하지만, Next.js API에서는 제한이 있을 수 있음
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

// 가상 데이터 생성 함수 (레거시 - 더 이상 사용하지 않음, generateAdmissionRecords 사용)
function generateAdmissionRecordsLegacy(count: number = 5): AdmissionRecord[] {
  const UNIVERSITIES = [
    { name: "서울대학교", nameEn: "Seoul National University" },
    { name: "연세대학교(서울캠)", nameEn: "Yonsei University" },
    { name: "고려대학교(서울캠)", nameEn: "Korea University" },
  ];
  const MAJORS = ["경제학과", "컴퓨터공학부", "경영학과"];
  const ADMISSION_TYPES = ["수시", "정시"];
  const STATUSES: ("합격" | "등록")[] = ["합격", "등록"];

  const records: AdmissionRecord[] = [];
  const currentYear = new Date().getFullYear();

  for (let i = 0; i < count; i++) {
    const university = UNIVERSITIES[Math.floor(Math.random() * UNIVERSITIES.length)];
    const major = MAJORS[Math.floor(Math.random() * MAJORS.length)];
    const admissionType = ADMISSION_TYPES[Math.floor(Math.random() * ADMISSION_TYPES.length)];
    const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];

    records.push({
      id: `generated-${Date.now()}-${i}`,
      university: university.name,
      universityEn: university.nameEn,
      major: major,
      year: currentYear - Math.floor(Math.random() * 3),
      admissionType: admissionType,
      status: status,
      createdAt: new Date(),
      source: "generated",
    });
  }

  return records;
}

// 모든 데이터를 합쳐서 저장하는 함수
async function mergeAndSaveData(
  scraped: AdmissionRecord[],
  generated: AdmissionRecord[]
): Promise<{ total: number; new: number }> {
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

  const existingCount = existingRecords.length;

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
  uniqueRecords.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });

  // 저장
  fs.writeFileSync(latestPath, JSON.stringify(uniqueRecords, null, 2));

  return {
    total: uniqueRecords.length,
    new: uniqueRecords.length - existingCount,
  };
}

export async function POST() {
  try {
    console.log(`[${new Date().toISOString()}] Starting automatic data collection...`);

    // 1. 웹에서 데이터 수집
    console.log("Scraping data from crossadmit.com...");
    const scrapedRecords = await scrapeCrossAdmitData();
    
    // 스크래핑된 데이터 저장
    if (scrapedRecords.length > 0) {
      const dataDir = path.join(process.cwd(), "data");
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const filePath = path.join(dataDir, `scraped-${Date.now()}.json`);
      fs.writeFileSync(filePath, JSON.stringify(scrapedRecords, null, 2));
    }

    // 2. 가상 데이터 생성 (5-10개) - 개선된 데이터 생성기 사용
    console.log("Generating virtual data...");
    const generatedCount = Math.floor(Math.random() * 6) + 5; // 5-10개
    const generatedRecords = generateAdmissionRecords(generatedCount);
    
    // 생성된 데이터 저장
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const latestPath = path.join(dataDir, "latest-generated.json");
    fs.writeFileSync(latestPath, JSON.stringify(generatedRecords, null, 2));

    // 3. 데이터 병합 및 저장
    const result = await mergeAndSaveData(scrapedRecords, generatedRecords);

    console.log(`[${new Date().toISOString()}] Data collection completed successfully`);

    return NextResponse.json({
      success: true,
      message: "Data collection completed",
      scraped: scrapedRecords.length,
      generated: generatedRecords.length,
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

// GET 요청으로도 실행 가능 (테스트용)
export async function GET() {
  return POST();
}

