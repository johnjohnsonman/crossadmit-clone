import Link from "next/link";
import { formatTextWithLineBreaks } from "@/lib/utils/format-text";

type Props = {
  mentorIntro?: string;
  locale?: "ko" | "en";
};

export function AdmissionMentorBadge({ locale = "en" }: { locale?: "ko" | "en" }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
      🤝 {locale === "en" ? "Available as mentor" : "멘토 가능"}
    </span>
  );
}

export default function AdmissionMentorBlock({
  mentorIntro,
  locale = "en",
}: Props) {
  const intro = mentorIntro?.trim();
  if (!intro) {
    return (
      <p className="mt-3 text-sm text-gray-400">
        {locale === "en"
          ? "Ask a question in the comments below →"
          : "아래 댓글로 질문해 주세요 →"}
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
        {locale === "en" ? "Message from the writer" : "작성자 메시지"}
      </h3>
      <div className="mt-2 text-sm leading-relaxed text-gray-200">
        {formatTextWithLineBreaks(intro)}
      </div>
      <Link
        href="#comments"
        className="mt-3 inline-block text-sm font-medium text-emerald-400 hover:underline"
      >
        {locale === "en"
          ? "Ask a question in the comments below →"
          : "댓글로 질문하기 →"}
      </Link>
    </div>
  );
}
