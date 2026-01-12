import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface CrossAdmitSubmission {
  id: string;
  admittedUniversities: string[];
  registeredUniversity: string;
  admittedMajors?: Record<string, string>; // 학교별 학과 정보
  registeredMajor?: string; // 등록한 학과
  createdAt: Date;
}

interface CrossAdmitStats {
  [key: string]: {
    total: number;
    chose: number;
  };
}

function loadCrossAdmitData(): CrossAdmitSubmission[] {
  try {
    const dataDir = path.join(process.cwd(), "data");
    const filePath = path.join(dataDir, "crossadmit.json");
    
    console.log(`[CrossAdmit] Loading data from: ${filePath}`);
    console.log(`[CrossAdmit] File exists: ${fs.existsSync(filePath)}`);
    
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      const submissions: CrossAdmitSubmission[] = JSON.parse(data);
      console.log(`[CrossAdmit] Loaded ${submissions.length} submissions`);
      return submissions.map((s) => ({
        ...s,
        createdAt: new Date(s.createdAt),
      }));
    } else {
      console.log(`[CrossAdmit] File does not exist, returning empty array`);
    }
  } catch (error) {
    console.error("[CrossAdmit] Error loading crossadmit data:", error);
  }
  return [];
}

function saveCrossAdmitData(submissions: CrossAdmitSubmission[]): void {
  try {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const filePath = path.join(dataDir, "crossadmit.json");
    fs.writeFileSync(filePath, JSON.stringify(submissions, null, 2));
  } catch (error) {
    console.error("Error saving crossadmit data:", error);
  }
}

function calculateStats(submissions: CrossAdmitSubmission[]): Record<string, CrossAdmitStats> {
  const stats: Record<string, CrossAdmitStats> = {};

  submissions.forEach((submission) => {
    const { admittedUniversities, registeredUniversity } = submission;

    // 모든 대학 쌍에 대해 통계 계산
    for (let i = 0; i < admittedUniversities.length; i++) {
      for (let j = i + 1; j < admittedUniversities.length; j++) {
        const uni1 = admittedUniversities[i];
        const uni2 = admittedUniversities[j];
        
        // 정렬된 키 생성 (항상 동일한 순서)
        const key = [uni1, uni2].sort().join(" vs ");

        if (!stats[key]) {
          stats[key] = {
            [uni1]: { total: 0, chose: 0 },
            [uni2]: { total: 0, chose: 0 },
          };
        }

        // 두 대학 모두 합격한 경우
        stats[key][uni1].total++;
        stats[key][uni2].total++;

        // 선택한 대학 카운트
        if (registeredUniversity === uni1) {
          stats[key][uni1].chose++;
        } else if (registeredUniversity === uni2) {
          stats[key][uni2].chose++;
        }
      }
    }
  });

  return stats;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { admittedUniversities, registeredUniversity, admittedMajors, registeredMajor } = body;

    if (!admittedUniversities || !Array.isArray(admittedUniversities) || admittedUniversities.length < 2) {
      return NextResponse.json(
        { error: "최소 2개 이상의 대학에 합격해야 합니다." },
        { status: 400 }
      );
    }

    if (!registeredUniversity || !admittedUniversities.includes(registeredUniversity)) {
      return NextResponse.json(
        { error: "등록한 대학은 합격한 대학 목록에 포함되어야 합니다." },
        { status: 400 }
      );
    }

    const submissions = loadCrossAdmitData();
    
    const newSubmission: CrossAdmitSubmission = {
      id: `crossadmit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      admittedUniversities,
      registeredUniversity,
      admittedMajors: admittedMajors || {},
      registeredMajor: registeredMajor || "",
      createdAt: new Date(),
    };

    submissions.push(newSubmission);
    saveCrossAdmitData(submissions);

    return NextResponse.json({
      success: true,
      message: "등록이 완료되었습니다.",
      id: newSubmission.id,
    });
  } catch (error) {
    console.error("Error processing crossadmit submission:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// 합격DB에서 학과 정보 가져오기
function loadAdmissionData() {
  try {
    const dataDir = path.join(process.cwd(), "data");
    const filePath = path.join(dataDir, "all-admissions.json");
    
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading admission data:", error);
  }
  return [];
}

// 학과별 통계 계산 (실제 제출 데이터 기반)
function calculateMajorStats(
  submissions: CrossAdmitSubmission[],
  admissionRecords: any[]
): Record<string, {
  majors: Record<string, {
    total: number;
    chose: number;
    percentage: number;
  }>;
  majorMatches: Array<{
    major1: string;
    major2: string;
    total: number;
    chose1: number;
    chose2: number;
    percentage1: number;
    percentage2: number;
  }>;
}> {
  const majorStats: Record<string, {
    majors: Record<string, {
      total: number;
      chose: number;
      percentage: number;
    }>;
    majorMatches: Array<{
      major1: string;
      major2: string;
      total: number;
      chose1: number;
      chose2: number;
      percentage1: number;
      percentage2: number;
    }>;
  }> = {};

  // 각 대학 쌍에 대해 학과별 통계 계산
  submissions.forEach((submission) => {
    const { admittedUniversities, registeredUniversity, admittedMajors = {}, registeredMajor = "" } = submission;

    for (let i = 0; i < admittedUniversities.length; i++) {
      for (let j = i + 1; j < admittedUniversities.length; j++) {
        const uni1 = admittedUniversities[i];
        const uni2 = admittedUniversities[j];
        const key = [uni1, uni2].sort().join(" vs ");

        if (!majorStats[key]) {
          majorStats[key] = { majors: {}, majorMatches: [] };
        }

        // 각 대학의 학과 정보 가져오기
        const uni1Major = admittedMajors[uni1] || "미지정";
        const uni2Major = admittedMajors[uni2] || "미지정";

        // 각 대학별 학과 통계
        const uni1MajorKey = `${uni1}::${uni1Major}`;
        const uni2MajorKey = `${uni2}::${uni2Major}`;

        if (!majorStats[key].majors[uni1MajorKey]) {
          majorStats[key].majors[uni1MajorKey] = { total: 0, chose: 0, percentage: 0 };
        }
        if (!majorStats[key].majors[uni2MajorKey]) {
          majorStats[key].majors[uni2MajorKey] = { total: 0, chose: 0, percentage: 0 };
        }

        majorStats[key].majors[uni1MajorKey].total++;
        majorStats[key].majors[uni2MajorKey].total++;

        if (registeredUniversity === uni1) {
          majorStats[key].majors[uni1MajorKey].chose++;
        }
        if (registeredUniversity === uni2) {
          majorStats[key].majors[uni2MajorKey].chose++;
        }

        // 학과 매칭 통계 (같은 학과끼리 매칭)
        const matchKey = `${uni1Major}::${uni2Major}`;
        let matchFound = false;
        
        // 기존 매칭 찾기
        for (const match of majorStats[key].majorMatches) {
          if (
            (match.major1 === uni1Major && match.major2 === uni2Major) ||
            (match.major1 === uni2Major && match.major2 === uni1Major)
          ) {
            match.total++;
            if (registeredUniversity === uni1) {
              match.chose1++;
            } else if (registeredUniversity === uni2) {
              match.chose2++;
            }
            matchFound = true;
            break;
          }
        }

        // 새로운 매칭 추가
        if (!matchFound) {
          majorStats[key].majorMatches.push({
            major1: uni1Major,
            major2: uni2Major,
            total: 1,
            chose1: registeredUniversity === uni1 ? 1 : 0,
            chose2: registeredUniversity === uni2 ? 1 : 0,
            percentage1: 0,
            percentage2: 0,
          });
        }
      }
    }
  });

  // 퍼센트 계산
  Object.keys(majorStats).forEach((key) => {
    // 각 대학별 학과 퍼센트
    Object.keys(majorStats[key].majors).forEach((majorKey) => {
      const stat = majorStats[key].majors[majorKey];
      if (stat.total > 0) {
        stat.percentage = Math.round((stat.chose / stat.total) * 100);
      }
    });

    // 학과 매칭 퍼센트
    majorStats[key].majorMatches.forEach((match) => {
      if (match.total > 0) {
        match.percentage1 = Math.round((match.chose1 / match.total) * 100);
        match.percentage2 = Math.round((match.chose2 / match.total) * 100);
      }
    });

    // 매칭 정렬 (total 내림차순)
    majorStats[key].majorMatches.sort((a, b) => b.total - a.total);
  });

  return majorStats;
}

// 특정 대학 쌍에 대한 개별 제출 데이터 가져오기
function getSubmissionsForComparison(
  submissions: CrossAdmitSubmission[],
  university1: string,
  university2: string
): CrossAdmitSubmission[] {
  return submissions.filter((submission) => {
    const { admittedUniversities } = submission;
    return (
      admittedUniversities.includes(university1) &&
      admittedUniversities.includes(university2)
    );
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const university1 = searchParams.get("university1");
    const university2 = searchParams.get("university2");
    const comparisonId = searchParams.get("id");

    // 특정 comparisonId로 조회
    if (comparisonId) {
      const submissions = loadCrossAdmitData();
      const admissionRecords = loadAdmissionData();
      const stats = calculateStats(submissions);
      const majorStats = calculateMajorStats(submissions, admissionRecords);

      // 모든 비교 데이터 생성
      const allComparisons: Array<{
        id: string;
        university1: string;
        university2: string;
        totalAdmitted: number;
        choseUniversity1: number;
        choseUniversity2: number;
        percentage1: number;
        percentage2: number;
        confidenceInterval1: { min: number; max: number };
        confidenceInterval2: { min: number; max: number };
        majorStats?: any;
      }> = [];

      Object.entries(stats).forEach(([key, data]) => {
        const [uni1, uni2] = key.split(" vs ");
        const total1 = data[uni1]?.total || 0;
        const total2 = data[uni2]?.total || 0;
        const chose1 = data[uni1]?.chose || 0;
        const chose2 = data[uni2]?.chose || 0;
        const totalAdmitted = Math.max(total1, total2);

        if (totalAdmitted > 0) {
          const percentage1 = Math.round((chose1 / totalAdmitted) * 100);
          const percentage2 = Math.round((chose2 / totalAdmitted) * 100);
          const margin1 = Math.round((1.96 * Math.sqrt((percentage1 * (100 - percentage1)) / totalAdmitted)) * 10) / 10;
          const margin2 = Math.round((1.96 * Math.sqrt((percentage2 * (100 - percentage2)) / totalAdmitted)) * 10) / 10;

          const majorData = majorStats[key];
          const majorStats1: Array<{ major: string; total: number; chose: number; percentage: number }> = [];
          const majorStats2: Array<{ major: string; total: number; chose: number; percentage: number }> = [];
          const majorMatches: Array<{
            major1: string;
            major2: string;
            total: number;
            chose1: number;
            chose2: number;
            percentage1: number;
            percentage2: number;
          }> = [];

          if (majorData) {
            Object.entries(majorData.majors).forEach(([majorKey, stat]: [string, any]) => {
              const [uni, major] = majorKey.split("::");
              if (uni === uni1) {
                majorStats1.push({ major, total: stat.total, chose: stat.chose, percentage: stat.percentage });
              } else if (uni === uni2) {
                majorStats2.push({ major, total: stat.total, chose: stat.chose, percentage: stat.percentage });
              }
            });
            majorMatches.push(...majorData.majorMatches);
            majorStats1.sort((a, b) => b.total - a.total);
            majorStats2.sort((a, b) => b.total - a.total);
            majorMatches.sort((a, b) => b.total - a.total);
          }

          allComparisons.push({
            id: key.toLowerCase().replace(/\s+/g, "-").replace(/[()]/g, ""),
            university1: uni1,
            university2: uni2,
            totalAdmitted,
            choseUniversity1: chose1,
            choseUniversity2: chose2,
            percentage1,
            percentage2,
            confidenceInterval1: {
              min: Math.max(0, Math.round((percentage1 - margin1) * 10) / 10),
              max: Math.min(100, Math.round((percentage1 + margin1) * 10) / 10),
            },
            confidenceInterval2: {
              min: Math.max(0, Math.round((percentage2 - margin2) * 10) / 10),
              max: Math.min(100, Math.round((percentage2 + margin2) * 10) / 10),
            },
            majorStats: majorStats1.length > 0 || majorStats2.length > 0 || majorMatches.length > 0 ? {
              university1: majorStats1,
              university2: majorStats2,
              majorMatches: majorMatches,
            } : undefined,
          });
        }
      });

      const found = allComparisons.find((c) => c.id === comparisonId);
      if (found) {
        return NextResponse.json({
          success: true,
          comparison: found,
        });
      } else {
        return NextResponse.json({
          success: false,
          error: "Comparison not found",
        }, { status: 404 });
      }
    }

    // 특정 대학 쌍의 개별 제출 데이터 요청
    if (university1 && university2) {
      const submissions = loadCrossAdmitData();
      const filteredSubmissions = getSubmissionsForComparison(
        submissions,
        university1,
        university2
      );

      // 날짜순 정렬 (최신순)
      filteredSubmissions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return NextResponse.json({
        success: true,
        submissions: filteredSubmissions.map((s) => ({
          id: s.id,
          admittedUniversities: s.admittedUniversities,
          registeredUniversity: s.registeredUniversity,
          admittedMajors: s.admittedMajors || {},
          registeredMajor: s.registeredMajor || "",
          createdAt: s.createdAt,
        })),
      });
    }

    // 전체 통계 요청
    const submissions = loadCrossAdmitData();
    console.log(`[CrossAdmit API] Loaded ${submissions.length} submissions`);
    const admissionRecords = loadAdmissionData();
    const stats = calculateStats(submissions);
    console.log(`[CrossAdmit API] Calculated stats for ${Object.keys(stats).length} comparisons`);
    const majorStats = calculateMajorStats(submissions, admissionRecords);

    // 통계를 비교 가능한 형식으로 변환
    const comparisons: Array<{
      id: string;
      university1: string;
      university2: string;
      totalAdmitted: number;
      choseUniversity1: number;
      choseUniversity2: number;
      percentage1: number;
      percentage2: number;
      confidenceInterval1: { min: number; max: number };
      confidenceInterval2: { min: number; max: number };
      majorStats?: {
        university1: Array<{ major: string; total: number; chose: number; percentage: number }>;
        university2: Array<{ major: string; total: number; chose: number; percentage: number }>;
        majorMatches: Array<{
          major1: string;
          major2: string;
          total: number;
          chose1: number;
          chose2: number;
          percentage1: number;
          percentage2: number;
        }>;
      };
    }> = [];

    Object.entries(stats).forEach(([key, data]) => {
      const [uni1, uni2] = key.split(" vs ");
      const total1 = data[uni1]?.total || 0;
      const total2 = data[uni2]?.total || 0;
      const chose1 = data[uni1]?.chose || 0;
      const chose2 = data[uni2]?.chose || 0;

      // 두 대학 모두 합격한 총 인원 (중복 제거)
      const totalAdmitted = Math.max(total1, total2);

      if (totalAdmitted > 0) {
        const percentage1 = Math.round((chose1 / totalAdmitted) * 100);
        const percentage2 = Math.round((chose2 / totalAdmitted) * 100);

        // 95% 신뢰구간 계산 (간단한 근사)
        const margin1 = Math.round((1.96 * Math.sqrt((percentage1 * (100 - percentage1)) / totalAdmitted)) * 10) / 10;
        const margin2 = Math.round((1.96 * Math.sqrt((percentage2 * (100 - percentage2)) / totalAdmitted)) * 10) / 10;

        // 학과별 통계 가져오기
        const majorData = majorStats[key];
        const majorStats1: Array<{ major: string; total: number; chose: number; percentage: number }> = [];
        const majorStats2: Array<{ major: string; total: number; chose: number; percentage: number }> = [];
        const majorMatches: Array<{
          major1: string;
          major2: string;
          total: number;
          chose1: number;
          chose2: number;
          percentage1: number;
          percentage2: number;
        }> = [];

        if (majorData) {
          // 각 대학별 학과 통계
          Object.keys(majorData.majors).forEach((majorKey) => {
            const [university, major] = majorKey.split("::");
            const stat = majorData.majors[majorKey];
            
            if (university === uni1) {
              majorStats1.push({
                major,
                total: stat.total,
                chose: stat.chose,
                percentage: stat.percentage,
              });
            } else if (university === uni2) {
              majorStats2.push({
                major,
                total: stat.total,
                chose: stat.chose,
                percentage: stat.percentage,
              });
            }
          });

          // 정렬 (total 내림차순)
          majorStats1.sort((a, b) => b.total - a.total);
          majorStats2.sort((a, b) => b.total - a.total);

          // 학과 매칭 정보
          if (majorData.majorMatches) {
            majorMatches.push(...majorData.majorMatches);
          }
        }

        comparisons.push({
          id: key.toLowerCase().replace(/\s+/g, "-").replace(/[()]/g, ""),
          university1: uni1,
          university2: uni2,
          totalAdmitted,
          choseUniversity1: chose1,
          choseUniversity2: chose2,
          percentage1,
          percentage2,
          confidenceInterval1: {
            min: Math.max(0, Math.round((percentage1 - margin1) * 10) / 10),
            max: Math.min(100, Math.round((percentage1 + margin1) * 10) / 10),
          },
          confidenceInterval2: {
            min: Math.max(0, Math.round((percentage2 - margin2) * 10) / 10),
            max: Math.min(100, Math.round((percentage2 + margin2) * 10) / 10),
          },
          majorStats: majorStats1.length > 0 || majorStats2.length > 0 || majorMatches.length > 0 ? {
            university1: majorStats1,
            university2: majorStats2,
            majorMatches: majorMatches,
          } : undefined,
        });
      }
    });

    // 총 합격 인원순으로 정렬
    comparisons.sort((a, b) => b.totalAdmitted - a.totalAdmitted);

    console.log(`[CrossAdmit API] Returning ${comparisons.length} comparisons`);

    return NextResponse.json({
      success: true,
      comparisons,
      totalSubmissions: submissions.length,
    });
  } catch (error) {
    console.error("Error fetching crossadmit stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
