import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams.id;
  
  // ID에서 대학명 추출
  const universities = id.split("-vs-").map((u) => 
    u.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
  );

  const title = `${universities[0]} vs ${universities[1]} | 크로스어드밋 | CrossAdmit | 交叉录取`;
  const description = `${universities[0]}와 ${universities[1]}에 동시에 합격했을 때 학생들의 선택 통계를 확인하세요. Compare admission statistics between ${universities[0]} and ${universities[1]}. 比较${universities[0]}和${universities[1]}的录取统计。`;

  return {
    title,
    description,
    keywords: [
      `${universities[0]} vs ${universities[1]}`,
      "대학 선택 통계",
      "university admission statistics",
      "study in Korea",
      "Korean university",
      "大学录取统计",
      "留学韩国",
      "admisión universitaria",
      "estudiar en Corea",
    ],
    alternates: {
      canonical: `https://crossadmit.com/crossadmit/${id}`,
      languages: {
        ko: `https://crossadmit.com/crossadmit/${id}`,
        en: `https://crossadmit.com/en/crossadmit/${id}`,
        "zh-CN": `https://crossadmit.com/zh/crossadmit/${id}`,
        "zh-TW": `https://crossadmit.com/zh-tw/crossadmit/${id}`,
        es: `https://crossadmit.com/es/crossadmit/${id}`,
        ja: `https://crossadmit.com/ja/crossadmit/${id}`,
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://crossadmit.com/crossadmit/${id}`,
      locale: "ko_KR",
      alternateLocale: ["en_US", "zh_CN", "zh_TW", "es_ES", "ja_JP"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
