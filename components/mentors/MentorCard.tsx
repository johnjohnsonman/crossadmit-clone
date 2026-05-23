import Link from "next/link";
import type { Locale } from "@/lib/i18n/dictionary";
import { withLang } from "@/lib/i18n/locale";
import {
  isMentorFree,
  mentorStudentStatusLabel,
  mentorTagsFlat,
  mentorUniversityName,
} from "@/lib/mentors/display";
import type { MentorRow } from "@/lib/mentors/types";

type Props = {
  mentor: MentorRow;
  locale?: Locale;
};

export default function MentorCard({ mentor: m, locale = "ko" }: Props) {
  const tags = mentorTagsFlat(m).slice(0, 4);
  const statusLabel = mentorStudentStatusLabel(m.student_status, locale);
  const href = withLang(`/mentors/${m.id}`, locale);

  return (
    <Link
      href={href}
      className="block bg-gray-900 hover:bg-gray-800 rounded-lg p-4 transition border border-gray-800"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold shrink-0">
          {m.nickname.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-white flex items-center gap-2 flex-wrap">
            <span className="truncate">{m.nickname}</span>
            {m.is_legacy && (
              <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded shrink-0">
                ⭐ Legacy
              </span>
            )}
          </div>
          <div className="text-sm text-gray-400 truncate">
            {mentorUniversityName(m, locale)}
            {statusLabel ? ` · ${statusLabel}` : ""}
          </div>
        </div>
      </div>

      {m.greeting && (
        <p className="text-sm text-gray-300 italic mb-3 line-clamp-2">
          &ldquo;{locale === "en" && m.greeting_en ? m.greeting_en : m.greeting}
          &rdquo;
        </p>
      )}

      <p className="text-sm text-gray-400 mb-3 line-clamp-3">
        {locale === "en"
          ? m.intro_en || m.intro_kr
          : m.intro_kr || m.intro_en}
      </p>

      <div className="flex flex-wrap gap-1 mb-3">
        {tags.map((t) => (
          <span
            key={t.id}
            className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded"
          >
            {locale === "en" ? t.tag_en : t.tag_kr}
          </span>
        ))}
        {(m.tags?.length ?? 0) > 4 && (
          <span className="text-xs text-gray-500">
            +{(m.tags?.length ?? 0) - 4}
          </span>
        )}
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-gray-800">
        <div className="text-sm">
          {m.offers_admission && (
            <span className="text-blue-400">
              🎓 ${Number(m.price_admission_usd)}/hr
            </span>
          )}
          {m.offers_career && (
            <span className="text-green-400 ml-2">
              💼 ${Number(m.price_career_usd)}/hr
            </span>
          )}
          {isMentorFree(m) && (
            <span className="text-amber-400">🎁 Free</span>
          )}
        </div>
        <div className="text-xs text-gray-500">
          👁 {Number(m.view_count).toLocaleString()}
        </div>
      </div>
    </Link>
  );
}
