"use client";

import Link from "next/link";

interface AdmissionReview {
  id: string;
  university: string;
  major: string;
  year: number;
  admissionType: string;
  username: string;
  status: "합격" | "등록" | "지원";
}

export default function AdmissionReviews() {
  const reviews: AdmissionReview[] = [
    {
      id: "1",
      university: "서강대학교",
      major: "국어국문학과",
      year: 2020,
      admissionType: "편입학",
      username: "keshi",
      status: "등록",
    },
    {
      id: "2",
      university: "성균관대학교",
      major: "자연과학계열",
      year: 2018,
      admissionType: "학생부종합",
      username: "이환",
      status: "등록",
    },
    {
      id: "3",
      university: "Columbia University",
      major: "FinancialEconomics",
      year: 2021,
      admissionType: "Early Action",
      username: "동민",
      status: "지원",
    },
    {
      id: "4",
      university: "연세대학교(서울캠)",
      major: "국제통상학과",
      year: 2018,
      admissionType: "영어특기자 수시",
      username: "푸우우퐁",
      status: "등록",
    },
    {
      id: "5",
      university: "UPenn Wharton",
      major: "MBA",
      year: 2017,
      admissionType: "",
      username: "thatone",
      status: "등록",
    },
    {
      id: "6",
      university: "Northwestern University",
      major: "Kellogg MBA",
      year: 2021,
      admissionType: "Round 2",
      username: "EPIC",
      status: "합격",
    },
    {
      id: "7",
      university: "서울대학교",
      major: "의예과",
      year: 2021,
      admissionType: "",
      username: "박현수",
      status: "등록",
    },
    {
      id: "8",
      university: "고려대학교(서울캠)",
      major: "경제학과",
      year: 2017,
      admissionType: "",
      username: "Astra",
      status: "합격",
    },
    {
      id: "9",
      university: "UC Berkeley",
      major: "Political Science",
      year: 2003,
      admissionType: "Regular",
      username: "Arthur",
      status: "등록",
    },
    {
      id: "10",
      university: "UCLA",
      major: "Sociology",
      year: 2014,
      admissionType: "Regular decision",
      username: "Ellie",
      status: "합격",
    },
    {
      id: "11",
      university: "홍익대학교",
      major: "게임스프트웨어학과",
      year: 2014,
      admissionType: "정시",
      username: "jindol",
      status: "등록",
    },
    {
      id: "12",
      university: "고려대학교(서울캠)",
      major: "국어국문학과",
      year: 2020,
      admissionType: "학교추천 2",
      username: "고려대국어국문",
      status: "등록",
    },
    {
      id: "13",
      university: "성균관대학교",
      major: "법학전문대학원",
      year: 2021,
      admissionType: "일반전형",
      username: "고척SKY",
      status: "합격",
    },
    {
      id: "14",
      university: "성균관대학교",
      major: "법학전문대학원",
      year: 2021,
      admissionType: "일반",
      username: "이지헌",
      status: "합격",
    },
    {
      id: "15",
      university: "고려대학교(서울캠)",
      major: "국제학과",
      year: 2019,
      admissionType: "정시",
      username: "Jae",
      status: "등록",
    },
  ];

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif text-sage-800">합격후기</h2>
          <Link href="/reviews" className="text-tea-600 hover:text-tea-700 text-sm">
            more &gt;
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map((review) => (
            <Link
              key={review.id}
              href={`/reviews/${review.id}`}
              className="bg-sage-50 rounded-lg p-4 border border-sage-200 hover:shadow-md hover:border-tea-300 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-sage-900 mb-1">
                    {review.university}
                  </h3>
                  <p className="text-sm text-sage-700">{review.major}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                    review.status === "합격"
                      ? "bg-tea-100 text-tea-800"
                      : review.status === "등록"
                      ? "bg-sage-100 text-sage-800"
                      : "bg-sage-200 text-sage-700"
                  }`}
                >
                  {review.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-sage-500 mt-2">
                <span>
                  {review.year}년도 {review.admissionType && `· ${review.admissionType}`}
                </span>
                <span>· {review.username}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}


