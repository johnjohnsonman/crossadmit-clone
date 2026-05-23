export type RedditCategoryId =
  | "visa"
  | "admission"
  | "scholarship"
  | "dormitory"
  | "language"
  | "campus_life"
  | "settlement"
  | "employment"
  | "culture"
  | "living_cost"
  | "general";

export const REDDIT_CATEGORIES: {
  id: RedditCategoryId;
  emoji: string;
  label: string;
  description: string;
}[] = [
  {
    id: "visa",
    emoji: "🛂",
    label: "visa",
    description: "D-2, D-4, ARC, immigration for international students in Korea",
  },
  {
    id: "admission",
    emoji: "🎓",
    label: "admission",
    description: "Applications, documents, and admission tips for studying in Korea",
  },
  {
    id: "scholarship",
    emoji: "💰",
    label: "scholarship",
    description: "GKS, university scholarships, and financial aid",
  },
  {
    id: "dormitory",
    emoji: "🏠",
    label: "dormitory",
    description: "On-campus housing and dorm life",
  },
  {
    id: "language",
    emoji: "💬",
    label: "language",
    description: "TOPIK, Korean classes, and language institutes",
  },
  {
    id: "campus_life",
    emoji: "🏫",
    label: "campus_life",
    description: "Clubs, facilities, and student life",
  },
  {
    id: "settlement",
    emoji: "🏢",
    label: "settlement",
    description: "Banking, insurance, phone, and daily life setup",
  },
  {
    id: "employment",
    emoji: "💼",
    label: "employment",
    description: "Part-time work and post-graduation visas",
  },
  {
    id: "culture",
    emoji: "🎭",
    label: "culture",
    description: "Culture, food, and adapting to Korea",
  },
  {
    id: "living_cost",
    emoji: "💵",
    label: "living_cost",
    description: "Tuition, rent, and living expenses",
  },
];

const VALID = new Set(REDDIT_CATEGORIES.map((c) => c.id));

export function normalizePostCategory(
  category?: string | null,
  subcategory?: string | null
): string {
  const raw = (category || subcategory || "general").toLowerCase();
  if (VALID.has(raw as RedditCategoryId)) return raw;
  if (raw === "life" || raw === "cost") return "living_cost";
  return "general";
}

export function getCategoryMeta(id: string) {
  return (
    REDDIT_CATEGORIES.find((c) => c.id === id) ?? {
      id: "general" as RedditCategoryId,
      emoji: "📌",
      label: "general",
      description: "Study in Korea — all topics for international students",
    }
  );
}

export function postPath(category: string, slug: string): string {
  return `/r/${normalizePostCategory(category)}/${slug}`;
}
