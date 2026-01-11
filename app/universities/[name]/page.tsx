import { notFound } from "next/navigation";
import UniversityForum from "@/components/university/UniversityForum";
import UniversityAlumni from "@/components/university/UniversityAlumni";
import UniversityAdmissions from "@/components/university/UniversityAdmissions";
import UniversityGallery from "@/components/university/UniversityGallery";

interface PageProps {
  params: {
    name: string;
  };
}

// 대학교 정보 (실제로는 데이터베이스에서 가져와야 함)
const UNIVERSITY_INFO: Record<string, {
  name: string;
  nameEn: string;
  location: string;
  type: "국립" | "사립" | "외국";
  description: string;
}> = {
  "서울대학교": {
    name: "서울대학교",
    nameEn: "Seoul National University",
    location: "서울특별시 관악구",
    type: "국립",
    description: "대한민국의 대표적인 국립 종합대학입니다.",
  },
  "연세대학교(서울캠)": {
    name: "연세대학교(서울캠)",
    nameEn: "Yonsei University",
    location: "서울특별시 서대문구",
    type: "사립",
    description: "한국 최고의 사립 종합대학 중 하나입니다.",
  },
  "고려대학교(서울캠)": {
    name: "고려대학교(서울캠)",
    nameEn: "Korea University",
    location: "서울특별시 성북구",
    type: "사립",
    description: "명문 사립 종합대학입니다.",
  },
  "성균관대학교": {
    name: "성균관대학교",
    nameEn: "Sungkyunkwan University",
    location: "서울특별시 종로구",
    type: "사립",
    description: "600년 전통의 명문 대학입니다.",
  },
  "중앙대학교": {
    name: "중앙대학교",
    nameEn: "Chung-Ang University",
    location: "서울특별시 동작구",
    type: "사립",
    description: "예술과 미디어 분야에서 유명한 대학입니다.",
  },
};

export default function UniversityPage({ params }: PageProps) {
  const decodedName = decodeURIComponent(params.name);
  const universityInfo = UNIVERSITY_INFO[decodedName];

  if (!universityInfo) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-tea-50">
      <div className="bg-white border-b border-sage-200">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-serif text-sage-800 mb-2">
            {universityInfo.name}
          </h1>
          <p className="text-lg text-sage-600 mb-4">{universityInfo.nameEn}</p>
          <div className="flex items-center space-x-4 text-sm text-sage-500">
            <span>{universityInfo.location}</span>
            <span>•</span>
            <span>{universityInfo.type}</span>
          </div>
          <p className="mt-4 text-sage-700">{universityInfo.description}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: 게시판 */}
          <div className="lg:col-span-2 space-y-8">
            <UniversityForum universityName={decodedName} />
            <UniversityAdmissions universityName={decodedName} />
          </div>

          {/* 오른쪽: 유명 동문, 갤러리 */}
          <div className="space-y-8">
            <UniversityAlumni universityName={decodedName} />
            <UniversityGallery universityName={decodedName} />
          </div>
        </div>
      </div>
    </main>
  );
}


