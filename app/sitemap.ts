import { MetadataRoute } from "next";
import fs from "fs";
import path from "path";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://crossadmit.com"; // 실제 도메인으로 변경 필요

  // 정적 페이지 (다국어 버전 포함)
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
      alternates: {
        languages: {
          ko: baseUrl,
          en: `${baseUrl}/en`,
          "zh-CN": `${baseUrl}/zh`,
          "zh-TW": `${baseUrl}/zh-tw`,
          es: `${baseUrl}/es`,
          ja: `${baseUrl}/ja`,
        },
      },
    },
    {
      url: `${baseUrl}/crossadmit`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
      alternates: {
        languages: {
          ko: `${baseUrl}/crossadmit`,
          en: `${baseUrl}/en/crossadmit`,
          "zh-CN": `${baseUrl}/zh/crossadmit`,
          "zh-TW": `${baseUrl}/zh-tw/crossadmit`,
          es: `${baseUrl}/es/crossadmit`,
          ja: `${baseUrl}/ja/crossadmit`,
        },
      },
    },
    {
      url: `${baseUrl}/crossadmit/register`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/forum`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/admissions`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  // 동적 페이지 - 크로스어드밋 비교
  const crossAdmitPages: MetadataRoute.Sitemap = [];
  try {
    const dataDir = path.join(process.cwd(), "data");
    const crossAdmitPath = path.join(dataDir, "crossadmit.json");
    
    if (fs.existsSync(crossAdmitPath)) {
      const data = fs.readFileSync(crossAdmitPath, "utf-8");
      const submissions = JSON.parse(data);
      
      // 통계 계산하여 비교 페이지 생성
      const comparisons = new Set<string>();
      submissions.forEach((sub: any) => {
        const { admittedUniversities } = sub;
        for (let i = 0; i < admittedUniversities.length; i++) {
          for (let j = i + 1; j < admittedUniversities.length; j++) {
            const key = [admittedUniversities[i], admittedUniversities[j]]
              .sort()
              .join("-vs-")
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[()]/g, "");
            comparisons.add(key);
          }
        }
      });

      comparisons.forEach((id) => {
        crossAdmitPages.push({
          url: `${baseUrl}/crossadmit/${id}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.8,
        });
      });
    }
  } catch (error) {
    console.error("Error generating crossadmit sitemap:", error);
  }

  // 동적 페이지 - 합격 DB
  const admissionPages: MetadataRoute.Sitemap = [];
  try {
    const dataDir = path.join(process.cwd(), "data");
    const admissionsPath = path.join(dataDir, "all-admissions.json");
    
    if (fs.existsSync(admissionsPath)) {
      const data = fs.readFileSync(admissionsPath, "utf-8");
      const records = JSON.parse(data);
      
      records.slice(0, 1000).forEach((record: any) => {
        admissionPages.push({
          url: `${baseUrl}/admissions/${record.id}`,
          lastModified: new Date(record.createdAt),
          changeFrequency: "monthly",
          priority: 0.7,
        });
      });
    }
  } catch (error) {
    console.error("Error generating admissions sitemap:", error);
  }

  // 동적 페이지 - 포럼
  const forumPages: MetadataRoute.Sitemap = [];
  const universities = [
    "seoul-national",
    "yonsei",
    "korea",
    "sungkunkwan",
    "chungang",
    "hanyang",
    "stanford",
    "harvard",
    "mit",
    "berkeley",
    "ucla",
    "columbia",
  ];

  universities.forEach((uni) => {
    forumPages.push({
      url: `${baseUrl}/forum/${uni}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    });
    forumPages.push({
      url: `${baseUrl}/forum/${uni}/gallery`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
    forumPages.push({
      url: `${baseUrl}/forum/${uni}/news`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    });
    forumPages.push({
      url: `${baseUrl}/forum/${uni}/free`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    });
  });

  return [...staticPages, ...crossAdmitPages, ...admissionPages, ...forumPages];
}
