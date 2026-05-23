import Link from "next/link";
import { getMentorsForCategory } from "@/lib/mentors/queries";
import { mentorUniversityName } from "@/lib/mentors/display";
import { getCategoryMeta } from "@/lib/forum/reddit-categories";

type Props = {
  category: string;
};

export default async function MentorRecommendation({ category }: Props) {
  const mentors = await getMentorsForCategory(category, 3);
  if (mentors.length === 0) return null;

  const meta = getCategoryMeta(category);
  const label = meta.label;

  return (
    <aside className="bg-gray-900 rounded-lg p-4 mb-4 border border-gray-800">
      <h4 className="font-bold text-white mb-3">🎓 Talk to {label} experts</h4>
      <div className="space-y-3">
        {mentors.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3 hover:bg-gray-800 p-2 rounded transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold shrink-0">
              {m.nickname.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white truncate">
                {m.nickname}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {mentorUniversityName(m, "en")}
              </div>
            </div>
            <Link
              href={`/mentors/${m.id}`}
              className="text-xs bg-purple-600 text-white px-3 py-1 rounded shrink-0 hover:bg-purple-500"
            >
              View
            </Link>
          </div>
        ))}
      </div>
      <Link
        href="/mentors"
        className="block text-center mt-3 text-sm text-purple-400 hover:text-purple-300"
      >
        See all mentors →
      </Link>
    </aside>
  );
}
