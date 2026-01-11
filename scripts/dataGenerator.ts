import { AdmissionRecord } from "@/lib/types";
import fs from "fs";
import path from "path";
import { UNIQUE_MAJORS } from "@/lib/majors";
import { ALL_KOREAN_UNIVERSITIES } from "@/lib/koreanUniversities";

// 외국 대학 목록
const FOREIGN_UNIVERSITIES = [
  "Stanford University",
  "Harvard University",
  "MIT",
  "UC Berkeley",
  "UCLA",
  "University of Southern California",
  "Columbia University",
  "Yale University",
  "Princeton University",
  "New York University",
  "University of Pennsylvania",
  "Cornell University",
  "University of Chicago",
  "Duke University",
  "Northwestern University",
  "Johns Hopkins University",
  "Carnegie Mellon University",
  "University of Michigan",
  "University of Virginia",
  "University of North Carolina",
];

const UNIVERSITIES = [
  ...ALL_KOREAN_UNIVERSITIES.map(name => ({
    name,
    nameEn: name.replace(/대학교/g, "University").replace(/\(.*\)/g, ""),
  })),
  ...FOREIGN_UNIVERSITIES.map(name => ({
    name,
    nameEn: name,
  })),
];

const ADMISSION_TYPES_KR = ["수시", "정시", "편입학"];
const ADMISSION_TYPES_US = ["Early Action", "Early Decision", "Regular Decision", "Round 1", "Round 2"];
const STATUSES: ("합격" | "등록")[] = ["합격", "등록"];

// 사용자명 생성기
function generateUsername(): string {
  const prefixes = ["student", "admit", "future", "dream", "success", "hope", "star", "bright"];
  const suffixes = ["2024", "2025", "2026", "2027", "2028", "99", "88", "77", "66"];
  const randomNum = Math.floor(Math.random() * 1000);
  return `${prefixes[Math.floor(Math.random() * prefixes.length)]}${suffixes[Math.floor(Math.random() * suffixes.length)]}${randomNum}`;
}

// 테스트 스코어 생성
function generateTestScores(isUS: boolean): { type: string; score?: string } {
  if (isUS) {
    const types = ["SAT", "ACT", "Test optional", "Test free"];
    const type = types[Math.floor(Math.random() * types.length)];
    
    if (type === "SAT") {
      const score = Math.floor(Math.random() * 400) + 1200; // 1200-1600
      return { type, score: score.toString() };
    } else if (type === "ACT") {
      const score = Math.floor(Math.random() * 16) + 20; // 20-36
      return { type, score: score.toString() };
    }
    return { type };
  } else {
    // 한국 대학은 내신 중심
    return { type: "내신" };
  }
}

// GPA 생성
function generateGPA(isUS: boolean): { unweighted?: string; weighted?: string; ap?: string[]; dualEnrollment?: string } {
  if (isUS) {
    const unweighted = (Math.random() * 0.8 + 3.2).toFixed(1); // 3.2-4.0
    const weighted = (parseFloat(unweighted) + Math.random() * 0.5).toFixed(1); // weighted는 보통 더 높음
    
    const apSubjects = ["Calc AB", "Calc BC", "Physics 1", "Physics C", "Chemistry", "Biology", "US History", "World History", "English Lit", "Statistics"];
    const apCount = Math.floor(Math.random() * 5); // 0-4개
    const ap = apCount > 0 ? apSubjects.slice(0, apCount) : undefined;
    
    const dualEnrollment = Math.random() > 0.5 ? Math.floor(Math.random() * 20 + 5).toString() : undefined;
    
    return {
      unweighted: `${unweighted}/4.0`,
      weighted: `${weighted}/4.4`,
      ap,
      dualEnrollment
    };
  } else {
    // 한국은 등급 중심
    const grade = Math.floor(Math.random() * 2) + 1; // 1-2등급
    return {
      unweighted: `${grade}등급`,
      weighted: `${grade}등급`
    };
  }
}

// 특기 생성
function generateSpecialSkills(isUS: boolean): string[] {
  const usSkills = [
    "Website design", "3D CAD modeling", "National Latin exam", "Debate", "Volunteer work",
    "Research", "Internship", "Leadership", "Sports", "Music", "Art", "Community service",
    "Robotics", "Programming", "Writing", "Journalism"
  ];
  const krSkills = [
    "토론", "봉사활동", "독서", "체육", "음악", "미술", "과학실험", "프로그래밍",
    "디자인", "논술", "수학올림피아드", "영어", "리더십", "동아리활동", "인턴십"
  ];
  
  const skills = isUS ? usSkills : krSkills;
  const count = Math.floor(Math.random() * 4) + 1; // 1-4개
  const selected: string[] = [];
  const used = new Set<number>();
  
  while (selected.length < count && selected.length < skills.length) {
    const idx = Math.floor(Math.random() * skills.length);
    if (!used.has(idx)) {
      used.add(idx);
      selected.push(skills[idx]);
    }
  }
  
  return selected;
}

// 후기 생성
function generateReview(university: string, major: string, isUS: boolean): string {
  const krReviews = [
    `${university} ${major}에 합격하게 되어 정말 기쁩니다. 오랜 준비 끝에 원하는 결과를 얻을 수 있어서 감사합니다.`,
    `${university}는 제가 꿈꾸던 대학이었습니다. 좋은 환경에서 공부할 수 있어 기쁩니다.`,
    `열심히 준비한 결과 ${university}에 합격할 수 있었습니다. 앞으로도 더 노력하겠습니다.`,
    `${university} ${major}는 제가 가장 관심 있던 분야입니다. 합격 소식을 듣고 정말 기뻤습니다.`,
    `오랜 시간 준비한 끝에 ${university}에 합격했습니다. 감사합니다.`,
  ];
  
  const usReviews = [
    `I'm so happy to get accepted to ${university} ${major}. It's been my dream school for a long time.`,
    `After months of preparation, I finally got accepted to ${university}. I'm thrilled!`,
    `${university} was my top choice and I'm excited to attend. The ${major} program looks amazing.`,
    `Got accepted to ${university}! Can't wait to start my journey there.`,
    `After all the hard work, I'm so grateful to be accepted to ${university} ${major}.`,
  ];
  
  const reviews = isUS ? usReviews : krReviews;
  return reviews[Math.floor(Math.random() * reviews.length)];
}

export function generateAdmissionRecords(count: number = 10): AdmissionRecord[] {
  const records: AdmissionRecord[] = [];
  const currentYear = new Date().getFullYear();
  
  for (let i = 0; i < count; i++) {
    const university = UNIVERSITIES[Math.floor(Math.random() * UNIVERSITIES.length)];
    const isUS = !university.name.includes("대학교");
    // 공통 학과 목록에서 랜덤 선택
    const koreanMajors = UNIQUE_MAJORS.filter(m => !m.match(/^[A-Z]/)); // 한국어 학과
    const usMajors = UNIQUE_MAJORS.filter(m => m.match(/^[A-Z]/)); // 영어 학과
    const availableMajors = isUS ? usMajors : koreanMajors;
    const major = availableMajors.length > 0 
      ? availableMajors[Math.floor(Math.random() * availableMajors.length)]
      : (isUS ? "Computer Science" : "경제학과");
    
    const admissionType = isUS 
      ? ADMISSION_TYPES_US[Math.floor(Math.random() * ADMISSION_TYPES_US.length)]
      : ADMISSION_TYPES_KR[Math.floor(Math.random() * ADMISSION_TYPES_KR.length)];
    
    const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
    const year = currentYear - Math.floor(Math.random() * 5); // 최근 5년
    
    const record: AdmissionRecord = {
      id: `generated-${Date.now()}-${i}`,
      university: university.name,
      universityEn: university.nameEn,
      major: major,
      year: year,
      admissionType: admissionType,
      status: status,
      createdAt: new Date(),
      source: "generated",
      username: generateUsername(),
      testScores: generateTestScores(isUS),
      gpa: generateGPA(isUS),
      specialSkills: generateSpecialSkills(isUS),
      review: generateReview(university.name, major, isUS),
      likes: Math.floor(Math.random() * 20), // 0-19
      comments: [],
    };
    
    records.push(record);
  }
  
  return records;
}

export async function saveGeneratedData(records: AdmissionRecord[]): Promise<void> {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const filePath = path.join(dataDir, `generated-${Date.now()}.json`);
  fs.writeFileSync(filePath, JSON.stringify(records, null, 2));
  console.log(`Saved generated data to ${filePath}`);
  
  // 최신 데이터를 latest.json에도 저장
  const latestPath = path.join(dataDir, "latest-generated.json");
  fs.writeFileSync(latestPath, JSON.stringify(records, null, 2));
}

// 직접 실행 시
if (require.main === module) {
  const count = parseInt(process.argv[2]) || 10;
  const records = generateAdmissionRecords(count);
  saveGeneratedData(records);
  console.log(`Generated ${records.length} admission records`);
}


