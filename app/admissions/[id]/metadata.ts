import { Metadata } from "next";
import fs from "fs";
import path from "path";
import { AdmissionRecord } from "@/lib/types";

function loadAdmissionData(): AdmissionRecord[] {
  const defaultData: AdmissionRecord[] = [];
  
  try {
    const dataDir = path.join(process.cwd(), "data");
    const latestPath = path.join(dataDir, "all-admissions.json");
    
    if (fs.existsSync(latestPath)) {
      const data = fs.readFileSync(latestPath, "utf-8");
      const records: AdmissionRecord[] = JSON.parse(data);
      return records.map((record) => ({
        ...record,
        createdAt: new Date(record.createdAt),
      }));
    }
  } catch (error) {
    console.error("Error loading admission data:", error);
  }
  
  return defaultData;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const records = loadAdmissionData();
  const record = records.find((r) => r.id === resolvedParams.id);

  if (!record) {
    return {
      title: "합격자 정보를 찾을 수 없습니다 | 크로스어드밋",
    };
  }

  const title = `${record.university} ${record.major} 합격 정보 | ${record.year}년도 ${record.admissionType}`;
  const description = `${record.university} ${record.major} ${record.year}년도 ${record.admissionType} 합격자 정보. 테스트 스코어, 내신, 특기 등 상세 정보를 확인하세요.`;

  return {
    title,
    description,
    keywords: [
      record.university,
      record.major,
      `${record.year}년도 입시`,
      record.admissionType,
      "합격 정보",
      "입시 데이터",
    ],
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://crossadmit.com/admissions/${record.id}`,
      publishedTime: record.createdAt.toISOString(),
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}
