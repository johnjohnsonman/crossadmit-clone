import { MetadataRoute } from "next";
import fs from "fs";
import path from "path";
import { REDDIT_CATEGORIES } from "@/lib/forum/reddit-categories";
import { localizedUrls, sitemapAlternates } from "@/lib/seo/metadata";
import { getSitemapMentors, getSitemapPosts } from "@/lib/seo/sitemap-data";

export const revalidate = 3600;

type SitemapChangeFrequency = NonNullable<
  MetadataRoute.Sitemap[number]["changeFrequency"]
>;

function buildLocalizedEntries(
  pathname: string,
  options: {
    lastModified: Date;
    changeFrequency: SitemapChangeFrequency;
    priority: number;
  }
): MetadataRoute.Sitemap {
  const urls = localizedUrls(pathname);

  return [
    {
      url: urls.ko,
      lastModified: options.lastModified,
      changeFrequency: options.changeFrequency,
      priority: options.priority,
      alternates: sitemapAlternates(pathname),
    },
    {
      url: urls.en,
      lastModified: options.lastModified,
      changeFrequency: options.changeFrequency,
      priority: options.priority,
      alternates: sitemapAlternates(pathname),
    },
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    ...buildLocalizedEntries("/", {
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    }),
    ...buildLocalizedEntries("/forum", {
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    }),
    ...buildLocalizedEntries("/mentors", {
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    }),
    ...buildLocalizedEntries("/about", {
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    }),
    ...buildLocalizedEntries("/admissions", {
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    }),
    ...buildLocalizedEntries("/crossadmit", {
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.95,
    }),
    ...buildLocalizedEntries("/study-korea", {
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    }),
    ...buildLocalizedEntries("/videos", {
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    }),
  ];

  const categoryHubs: MetadataRoute.Sitemap = REDDIT_CATEGORIES.flatMap((c) =>
    buildLocalizedEntries(`/r/${c.id}`, {
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    })
  );

  const postPages: MetadataRoute.Sitemap = (await getSitemapPosts(2000)).flatMap(
    (p) =>
      buildLocalizedEntries(p.path, {
        lastModified: p.lastModified,
        changeFrequency: "weekly",
        priority: 0.7,
      })
  );

  const mentorPages: MetadataRoute.Sitemap = (await getSitemapMentors(500)).flatMap(
    (m) =>
      buildLocalizedEntries(`/mentors/${m.id}`, {
        lastModified: m.lastModified,
        changeFrequency: "monthly",
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
        crossAdmitPages.push(
          ...buildLocalizedEntries(`/crossadmit/${id}`, {
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
          })
        );
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
        admissionPages.push(
          ...buildLocalizedEntries(`/admissions/${record.id}`, {
            lastModified: new Date(record.createdAt),
            changeFrequency: "monthly",
            priority: 0.7,
          })
        );
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
  ].flatMap((uni) =>
    buildLocalizedEntries(`/forum/${uni}`, {
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    })
  );

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
