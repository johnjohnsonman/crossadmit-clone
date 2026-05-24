import Link from "next/link";
import { resolveLocale, withLang, type Locale } from "@/lib/i18n/locale";

type Copy = { title: string; paragraphs: string[]; back: string };

const PAGES: Record<string, Record<Locale, Copy>> = {
  about: {
    ko: {
      title: "서비스 소개",
      paragraphs: [
        "크로스어드밋은 한국 대학 합격 후기와 스펙을 모으는 커뮤니티 플랫폼입니다.",
        "지원자들이 현실적인 합격 데이터를 참고할 수 있도록 익명 후기 등록을 지원합니다.",
      ],
      back: "← 홈으로",
    },
    en: {
      title: "About CrossAdmit",
      paragraphs: [
        "CrossAdmit collects Korean university admission stories and applicant profiles.",
        "We help future students make informed choices with community-submitted, often anonymous stories.",
      ],
      back: "← Home",
    },
  },
  contact: {
    ko: {
      title: "문의하기",
      paragraphs: [
        "서비스 관련 문의는 아래 이메일로 보내주세요.",
        "이메일: support@crossadmit.app (예시)",
      ],
      back: "← 홈으로",
    },
    en: {
      title: "Contact",
      paragraphs: [
        "For questions about the service, reach us at:",
        "Email: support@crossadmit.app (placeholder)",
      ],
      back: "← Home",
    },
  },
  privacy: {
    ko: {
      title: "개인정보처리방침",
      paragraphs: [
        "본 페이지는 개인정보 처리 방침의 요약 stub입니다. 정식 문서는 추후 게시됩니다.",
        "후기 등록 시 입력하신 정보는 서비스 제공 목적으로만 사용됩니다.",
      ],
      back: "← 홈으로",
    },
    en: {
      title: "Privacy Policy",
      paragraphs: [
        "This is a short privacy policy stub. A full legal document will be published later.",
        "Information you submit is used only to operate the admissions database.",
      ],
      back: "← Home",
    },
  },
  terms: {
    ko: {
      title: "이용약관",
      paragraphs: [
        "본 페이지는 이용약관의 요약 stub입니다. 정식 약관은 추후 게시됩니다.",
        "허위 정보 등록 시 게시물이 삭제될 수 있습니다.",
      ],
      back: "← 홈으로",
    },
    en: {
      title: "Terms of Service",
      paragraphs: [
        "This is a short terms of service stub. Full terms will be published later.",
        "False submissions may be removed without notice.",
      ],
      back: "← Home",
    },
  },
};

export function StaticInfoPage({
  pageKey,
  lang,
}: {
  pageKey: keyof typeof PAGES;
  lang?: string;
}) {
  const locale = resolveLocale(lang);
  const t = PAGES[pageKey][locale];

  return (
    <main className="min-h-screen bg-gray-950 text-gray-300">
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Link
          href={withLang("/", locale)}
          className="text-sm font-medium text-orange-400 hover:underline"
        >
          {t.back}
        </Link>
        <h1 className="mt-8 text-3xl font-bold text-white">{t.title}</h1>
        <div className="mt-6 space-y-4 text-gray-400 leading-relaxed">
          {t.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </div>
    </main>
  );
}
