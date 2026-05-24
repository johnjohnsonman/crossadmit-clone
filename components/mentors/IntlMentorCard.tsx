import Link from "next/link";
import type { AdmissionRecord } from "@/lib/types";
import AdmitTrackBadge from "@/components/admissions/AdmitTrackBadge";
import {
  classOfLabel,
  mentorAvatarEmoji,
} from "@/lib/mentors/intl-mentor-display";
import { withLang } from "@/lib/i18n/locale";

type Props = {
  record: AdmissionRecord;
  locale: "ko" | "en";
};

function schoolChips(record: AdmissionRecord, locale: "ko" | "en") {
  const accepted = record.admissionSchools.filter(
    (s) => s.isAccept || s.isRegist
  );
  const enrolled = accepted.filter((s) => s.isRegist);
  const rest = accepted.filter((s) => !s.isRegist);
  const ordered = [...enrolled, ...rest].slice(0, 4);
  return ordered.map((s) => ({
    key: s.id,
    name: s.univName,
    enrolled: s.isRegist,
  }));
}

export default function IntlMentorCard({ record, locale }: Props) {
  const displayName = record.userHandle?.trim() || "Anonymous";
  const avatar = mentorAvatarEmoji(displayName, record.homeCountry);
  const chips = schoolChips(record, locale);
  const storyHref = withLang(`/admissions/${record.id}`, locale);
  const commentsHref = `${storyHref}#comments`;
  const intro = record.mentorIntro?.trim();

  return (
    <article className="flex flex-col rounded-xl border border-[#E5E5E0] bg-white p-5 shadow-sm min-h-[280px]">
      <div className="flex items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FAFAF8] border border-[#E5E5E0] text-lg font-semibold text-[#2D5A27]"
          aria-hidden
        >
          {avatar.length <= 2 ? avatar : <span className="text-xl">{avatar}</span>}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[#1A1A1A] truncate">{displayName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#6B7280] tabular-nums">
              {classOfLabel(record.year, locale)}
            </span>
            <AdmitTrackBadge track={record.admitTrack} locale={locale} />
          </div>
          {record.homeCountry ? (
            <p className="mt-1 text-xs text-[#9CA3AF]">
              {locale === "en" ? "HS: " : "고교: "}
              {record.homeCountry}
            </p>
          ) : null}
        </div>
      </div>

      {chips.length > 0 ? (
        <div className="mt-4">
          <p className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wide">
            {locale === "en" ? "Admitted to" : "합격·등록"}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <span
                key={c.key}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  c.enrolled
                    ? "bg-[#2D5A27]/10 text-[#2D5A27] border border-[#2D5A27]/30"
                    : "bg-[#FAFAF8] text-[#1A1A1A] border border-[#E5E5E0]"
                }`}
              >
                {c.name}
                {c.enrolled ? (locale === "en" ? " · Enrolled" : " · 등록") : ""}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {intro ? (
        <p className="mt-4 text-sm text-[#6B7280] line-clamp-2 leading-relaxed">
          {intro}
        </p>
      ) : (
        <p className="mt-4 text-sm text-[#9CA3AF] italic line-clamp-2">
          {locale === "en"
            ? "Open to questions via comments on their admission story."
            : "합격 후기 댓글로 질문할 수 있습니다."}
        </p>
      )}

      <div className="mt-auto pt-5 flex flex-col gap-2 sm:flex-row sm:gap-3">
        <Link
          href={storyHref}
          className="inline-flex justify-center rounded-lg bg-[#2D5A27] px-4 py-2 text-sm font-semibold text-white hover:bg-[#244a20] transition-colors"
        >
          {locale === "en" ? "Read full story →" : "후기 보기 →"}
        </Link>
        <Link
          href={commentsHref}
          className="inline-flex justify-center rounded-lg border border-[#E5E5E0] px-4 py-2 text-sm font-medium text-[#2D5A27] hover:bg-[#FAFAF8] transition-colors"
        >
          {locale === "en" ? "Ask in comments →" : "댓글로 질문 →"}
        </Link>
      </div>
    </article>
  );
}
