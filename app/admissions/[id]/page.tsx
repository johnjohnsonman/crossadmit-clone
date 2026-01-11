import { notFound } from "next/navigation";
import Link from "next/link";
import { AdmissionRecord } from "@/lib/types";
import fs from "fs";
import path from "path";
import AdmissionComments from "@/components/admission/AdmissionComments";
import PopularAdmissions from "@/components/admission/PopularAdmissions";
import PopularForum from "@/components/admission/PopularForum";
import PopularCrossAdmit from "@/components/admission/PopularCrossAdmit";
import LikeButton from "@/components/admission/LikeButton";
import StructuredData from "@/components/StructuredData";

interface PageProps {
  params: Promise<{
    id: string;
  }> | {
    id: string;
  };
}

function loadAdmissionData(): AdmissionRecord[] {
  const defaultData: AdmissionRecord[] = [
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
  ];

  try {
    const dataDir = path.join(process.cwd(), "data");
    const latestPath = path.join(dataDir, "all-admissions.json");
    
    if (fs.existsSync(latestPath)) {
      const data = fs.readFileSync(latestPath, "utf-8");
      const records: AdmissionRecord[] = JSON.parse(data);
      const processedRecords = records.map((record) => ({
        ...record,
        createdAt: new Date(record.createdAt),
        comments: record.comments?.map((c) => ({
          ...c,
          createdAt: new Date(c.createdAt),
        })),
      }));
      
      // 기본 데이터와 병합 (기본 데이터가 우선)
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
  
  return defaultData;
}

export default async function AdmissionDetailPage({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const records = loadAdmissionData();
  const record = records.find((r) => r.id === resolvedParams.id);

  if (!record) {
    notFound();
  }

  // 기본값 설정
  const username = record.username || "익명";
  const testScores = record.testScores;
  const gpa = record.gpa;
  const specialSkills = record.specialSkills || [];
  const review = record.review || "";
  const likes = record.likes || 0;
  const comments = record.comments || [];

  // 구조화된 데이터 생성 (다국어 지원)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${record.university} ${record.major} 합격 정보 | ${record.university} ${record.major} Admission Information`,
    alternateHeadline: `${record.university} ${record.major} 录取信息`,
    description: `${record.university} ${record.major} ${record.year}년도 ${record.admissionType} 합격자 정보 | ${record.university} ${record.major} ${record.year} ${record.admissionType} admission information | ${record.university} ${record.major} ${record.year}年${record.admissionType}录取信息`,
    inLanguage: ["ko", "en", "zh-CN", "zh-TW", "es", "ja"],
    author: {
      "@type": "Person",
      name: username,
    },
    datePublished: record.createdAt.toISOString(),
    dateModified: record.createdAt.toISOString(),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://crossadmit.com/admissions/${record.id}`,
    },
    about: {
      "@type": "EducationalOrganization",
      name: record.university,
      alternateName: record.universityEn,
    },
    keywords: [
      `${record.university} admission`,
      `${record.major} admission`,
      "study in Korea",
      "Korean university",
      "留学韩国",
      "大学录取",
    ],
  };

  return (
    <main className="min-h-screen bg-[#f5f3f0]">
      <StructuredData data={structuredData} />
      <div className="container mx-auto px-4 py-8">
        {/* 브레드크럼 */}
        <div className="mb-6 text-sm text-gray-600">
          <Link href="/admissions" className="hover:text-blue-600">합격DB</Link>
          <span className="mx-2">/</span>
          <span>{username}'s 합격DB</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 기본 정보 카드 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              {/* 상단 헤더 */}
              <div className="border-b border-gray-200 pb-6 mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* 대학 로고 */}
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                      {record.university.charAt(0)}
                    </div>
                    
                    {/* 기본 정보 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl font-bold text-gray-900">
                          {record.university}
                        </h1>
                        <span
                          className={`px-3 py-1 text-sm font-medium rounded-full ${
                            record.status === "합격"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {record.status}
                        </span>
                      </div>
                      <p className="text-base text-gray-600 mb-3">{record.universityEn}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span>{record.year}년도</span>
                        <span>·</span>
                        <span>{record.admissionType}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-800">{username}</span>
                        <span className="text-sm font-semibold text-gray-900">{record.major}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 좋아요/댓글 */}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <LikeButton admissionId={record.id} initialLikes={likes} />
                    <span className="flex items-center gap-1">
                      <span>👎</span>
                      <span>0</span>
                    </span>
                  </div>
                </div>
                
                {/* 등록 버튼 */}
                <div className="mt-4">
                  <button className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-md transition-colors">
                    {record.status === "등록" ? "등록" : "합격"}
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {/* 테스트 스코어 */}
                {testScores && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">테스트 스코어</h3>
                    <p className="text-gray-900 text-base">
                      {testScores.type}
                      {testScores.score && ` ${testScores.score}`}
                    </p>
                  </div>
                )}

                {/* 내신 */}
                {(gpa?.unweighted || gpa?.weighted || gpa?.ap || gpa?.dualEnrollment) && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">내신</h3>
                    <div className="space-y-2 text-gray-900 text-base">
                      {gpa.unweighted && (
                        <p>{gpa.unweighted}</p>
                      )}
                      {gpa.weighted && (
                        <p>{gpa.weighted}</p>
                      )}
                      {gpa.ap && gpa.ap.length > 0 && (
                        <div>
                          <p className="mb-1">AP</p>
                          <div className="flex flex-wrap gap-2">
                            {gpa.ap.map((ap, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                              >
                                {ap}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {gpa.dualEnrollment && (
                        <p>{gpa.dualEnrollment} dual enrollment credit</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 특기 */}
                {specialSkills.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">특기</h3>
                    <p className="text-gray-900 text-base">
                      {specialSkills.join("; ")}
                    </p>
                  </div>
                )}

                {/* 후기 및 학교 선택 이유 */}
                {review && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      후기 및 학교 선택 이유
                    </h3>
                    <p className="text-gray-900 text-base leading-relaxed whitespace-pre-line">{review}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 댓글 섹션 */}
            <AdmissionComments admissionId={record.id} comments={comments} />

          </div>

          {/* 사이드바 - 고정 */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              <PopularAdmissions />
              <PopularForum />
              <PopularCrossAdmit />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// 관련 합격자 추천 컴포넌트
function RelatedAdmissions({ 
  currentRecord, 
  allRecords 
}: { 
  currentRecord: AdmissionRecord; 
  allRecords: AdmissionRecord[] 
}) {
  // 같은 대학 또는 같은 전공의 다른 합격자 찾기
  const related = allRecords
    .filter(
      (r) =>
        r.id !== currentRecord.id &&
        (r.university === currentRecord.university || r.major === currentRecord.major)
    )
    .slice(0, 5);

  if (related.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-sage-200 p-6">
      <h2 className="text-xl font-serif text-sage-800 mb-4">관련 합격자</h2>
      <div className="space-y-3">
        {related.map((r) => (
          <Link
            key={r.id}
            href={`/admissions/${r.id}`}
            className="block p-3 border border-sage-200 rounded-lg hover:border-tea-300 hover:bg-tea-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sage-800">{r.university}</p>
                <p className="text-sm text-sage-600">{r.major}</p>
              </div>
              <div className="text-right">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    r.status === "합격"
                      ? "bg-tea-100 text-tea-800"
                      : "bg-sage-100 text-sage-800"
                  }`}
                >
                  {r.status}
                </span>
                <p className="text-xs text-sage-500 mt-1">{r.year}년</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
