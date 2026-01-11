import { NextResponse } from "next/server";
import { AdmissionRecord } from "@/lib/types";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const records: AdmissionRecord[] = body.records || [];

    if (records.length === 0) {
      return NextResponse.json(
        { error: "No records provided" },
        { status: 400 }
      );
    }

    // 데이터 디렉토리 확인
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
    const allRecords = [...existingRecords, ...records];
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

    return NextResponse.json({
      success: true,
      totalRecords: uniqueRecords.length,
      newRecords: records.length,
    });
  } catch (error) {
    console.error("Error uploading records:", error);
    return NextResponse.json(
      { error: "Failed to upload records" },
      { status: 500 }
    );
  }
}


