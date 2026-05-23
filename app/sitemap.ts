import { MetadataRoute } from "next";
import fs from "fs";
import path from "path";
import { REDDIT_CATEGORIES } from "@/lib/forum/reddit-categories";
import { SITE_URL } from "@/lib/seo/constants";
import { getSitemapMentors, getSitemapPosts } from "@/lib/seo/sitemap-data";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/forum`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/mentors`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/admissions`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/crossadmit`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/study-korea`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    },
  ];

  const categoryHubs: MetadataRoute.Sitemap = REDDIT_CATEGORIES.map((c) => ({
    url: `${baseUrl}/r/${c.id}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const postPages: MetadataRoute.Sitemap = (await getSitemapPosts(2000)).map(
    (p) => ({
      url: `${baseUrl}${p.path}`,
      lastModified: p.lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })
  );

  const mentorPages: MetadataRoute.Sitemap = (await getSitemapMentors(500)).map(
    (m) => ({
      url: `${baseUrl}/mentors/${m.id}`,
      lastModified: m.lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })
  );

  const crossAdmitPages: MetadataRoute.Sitemap = [];
  try {
    const crossAdmitPath = path.join(process.cwd(), "data", "crossadmit.json");
    if (fs.existsSync(crossAdmitPath)) {
      const submissions = JSON.parse(
        fs.readFileSync(crossAdmitPath, "utf-8")
      ) as { admittedUniversities: string[] }[];
      const comparisons = new Set<string>();
      submissions.forEach((sub) => {
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
    console.error("[sitemap] crossadmit:", error);
  }

  const admissionPages: MetadataRoute.Sitemap = [];
  try {
    const admissionsPath = path.join(process.cwd(), "data", "all-admissions.json");
    if (fs.existsSync(admissionsPath)) {
      const records = JSON.parse(
        fs.readFileSync(admissionsPath, "utf-8")
      ) as { id: string; createdAt: string }[];
      records.slice(0, 1000).forEach((record) => {
        admissionPages.push({
          url: `${baseUrl}/admissions/${record.id}`,
          lastModified: new Date(record.createdAt),
          changeFrequency: "monthly",
          priority: 0.7,
        });
      });
    }
  } catch (error) {
    console.error("[sitemap] admissions:", error);
  }

  const forumPages: MetadataRoute.Sitemap = [
    "seoul-national",
    "yonsei",
    "korea",
    "sungkunkwan",
    "chungang",
    "hanyang",
  ].map((uni) => ({
    url: `${baseUrl}/forum/${uni}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [
    ...staticPages,
    ...categoryHubs,
    ...postPages,
    ...mentorPages,
    ...crossAdmitPages,
    ...admissionPages,
    ...forumPages,
  ];
}
