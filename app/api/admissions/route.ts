import { NextResponse } from "next/server";
import { AdmissionRecord } from "@/lib/types";
import fs from "fs";
import path from "path";

// 데이터 파일에서 로드
function loadAdmissionData(): AdmissionRecord[] {
  try {
    const dataDir = path.join(process.cwd(), "data");
    const latestPath = path.join(dataDir, "all-admissions.json");
    
    if (fs.existsSync(latestPath)) {
      const data = fs.readFileSync(latestPath, "utf-8");
      const records: AdmissionRecord[] = JSON.parse(data);
      // Date 객체로 변환
      const processedRecords = records.map((record) => ({
        ...record,
        createdAt: new Date(record.createdAt),
      }));
      
      // 기본 데이터와 병합
      const defaultData = getDefaultData();
      const merged = [...defaultData];
      processedRecords.forEach((record) => {
        if (!merged.find((r) => r.id === record.id)) {
          merged.push(record);
        }
      });
      return merged;
    }
  } catch (error) {
    console.error("Error loading admission data:", error);
  }

  // 기본 데이터 반환
  return getDefaultData();
}

function getDefaultData(): AdmissionRecord[] {
  return [
    {
      id: "1",
      university: "서울대학교",
    universityEn: "Seoul National University",
    major: "경제학과",
    year: 2024,
    admissionType: "정시",
    status: "합격",
    createdAt: new Date(),
    source: "generated",
    username: "dav1234",
    testScores: {
      type: "Test optional",
    },
    gpa: {
      unweighted: "4.0/4.0",
      weighted: "4.4/4.4",
      ap: ["Calc AB", "Physics 1"],
      dualEnrollment: "14",
    },
    specialSkills: ["Website design", "3D CAD modeling", "National Latin exam"],
    review: "happy to get accepted",
    likes: 3,
    comments: [
      {
        id: "comment-1",
        author: "익명",
        content: "congrats much!",
        createdAt: new Date(),
        isAnonymous: true,
      },
    ],
  },
  {
    id: "2",
    university: "연세대학교(서울캠)",
    universityEn: "Yonsei University",
    major: "경제학과",
    year: 2024,
    admissionType: "수시",
    status: "등록",
    createdAt: new Date(),
    source: "generated",
    username: "student2024",
    testScores: {
      type: "SAT",
      score: "1500",
    },
    gpa: {
      unweighted: "3.8/4.0",
      weighted: "4.2/4.4",
    },
    specialSkills: ["Debate", "Volunteer work"],
    review: "연세대학교는 제가 꿈꾸던 대학이었습니다. 좋은 환경에서 공부할 수 있어 기쁩니다.",
    likes: 5,
    comments: [],
  },
  {
    id: "3",
    university: "고려대학교(서울캠)",
    universityEn: "Korea University",
    major: "신소재공학부",
    year: 2024,
    admissionType: "수시",
    status: "합격",
    createdAt: new Date(),
    source: "generated",
  },
  {
    id: "4",
    university: "성균관대학교",
    universityEn: "Sungkyunkwan University",
    major: "공학계열",
    year: 2024,
    admissionType: "정시",
    status: "합격",
    createdAt: new Date(),
    source: "generated",
  },
  {
    id: "5",
    university: "중앙대학교",
    universityEn: "Chung-Ang University",
    major: "화학공학과",
    year: 2024,
    admissionType: "수시",
    status: "합격",
    createdAt: new Date(),
    source: "generated",
  },
  {
    id: "6",
    university: "서울시립대학교",
    universityEn: "University of Seoul",
    major: "전기전자컴퓨터",
    year: 2024,
    admissionType: "정시",
    status: "합격",
    createdAt: new Date(),
    source: "generated",
  },
  {
    id: "7",
    university: "Stanford University",
    universityEn: "Stanford University",
    major: "MBA",
    year: 2024,
    admissionType: "Regular",
    status: "등록",
    createdAt: new Date(),
    source: "generated",
  },
  {
    id: "8",
    university: "서울대학교",
    universityEn: "Seoul National University",
    major: "의과대학의예과",
    year: 2024,
    admissionType: "수시",
    status: "등록",
    createdAt: new Date(),
    source: "generated",
  },
  {
    id: "9",
    university: "연세대학교(서울캠)",
    universityEn: "Yonsei University",
    major: "식품영양학과",
    year: 2024,
    admissionType: "수시",
    status: "합격",
    createdAt: new Date(),
    source: "generated",
  },
  {
    id: "10",
    university: "부산대학교",
    universityEn: "Pusan National University",
    major: "경제학부",
    year: 2024,
    admissionType: "정시",
    status: "합격",
    createdAt: new Date(),
    source: "generated",
  },
  ];
}

export async function GET() {
  const data = loadAdmissionData();
  return NextResponse.json(data);
}

